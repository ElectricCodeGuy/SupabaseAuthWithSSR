import React from 'react';
import {
  getMutableAIState,
  createStreamableUI,
  createStreamableValue
} from 'ai/rsc';
import { streamText, generateId, embed, generateObject } from 'ai';
import { Search, Loader2 } from 'lucide-react';
import { BotMessage } from '../component/ChatWrapper';
import { v4 as uuidv4 } from 'uuid';
import { openai } from '@ai-sdk/openai';
import { getUserInfo } from '@/lib/server/supabase';
import { createServerSupabaseClient } from '@/lib/server/server';
import {
  type SubmitMessageResult,
  getModel,
  saveChatToSupbabase,
  type AI
} from './shared';
import { z } from 'zod';
import { voyage } from 'voyage-ai-provider';

function sanitizeFilename(filename: string): string {
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

const zodSchemaSearch = z.object({
  variation1: z
    .string()
    .min(1)
    .describe(
      'A variation that precisely identifies the main topic or key concept of the query, aiming to match specific terminology used in authoritative sources. Output should be in English and is required.'
    ),
  variation2: z
    .string()
    .min(1)
    .describe(
      'A variation that focuses on the context or domain relevant to the question, tailored to find documents within the same field or area of interest. Output should be in English and is required.'
    ),
  variation3: z
    .string()
    .min(1)
    .describe(
      'A variation that focuses on potential applications or implications of the topic, to target documents discussing related outcomes or consequences. Output should be in English and is required.'
    )
});

async function querySupabaseVectors(
  queryEmbedding: number[],
  userId: string,
  selectedFiles: string[],
  topK = 40,
  similarityThreshold = 0.78
): Promise<
  {
    pageContent: string;
    metadata: {
      text: string;
      title: string;
      timestamp: string;
      ai_title: string;
      ai_description: string;
      ai_maintopics: string[];
      ai_keyentities: string[];
      filterTags: string;
      page: number;
      totalPages: number;
      chunk: number;
      totalChunks: number;
      similarity: number;
    };
  }[]
> {
  const supabase = await createServerSupabaseClient();

  // Convert embedding array to string format for query
  const embeddingString = `[${queryEmbedding.join(',')}]`;

  const { data: matches, error } = await supabase.rpc('match_documents', {
    query_embedding: embeddingString,
    match_count: topK,
    filter_user_id: userId,
    filter_files: selectedFiles,
    similarity_threshold: similarityThreshold
  });

  if (error) {
    console.error('Error querying vectors:', error);
    throw error;
  }

  return matches.map((match) => ({
    pageContent: match.text_content,
    metadata: {
      text: match.text_content,
      title: match.title,
      timestamp: match.doc_timestamp,
      ai_title: match.ai_title,
      ai_description: match.ai_description,
      ai_maintopics: match.ai_maintopics,
      ai_keyentities: match.ai_keyentities,
      filterTags: match.filter_tags,
      page: match.page_number,
      totalPages: match.total_pages,
      chunk: match.chunk_number,
      totalChunks: match.total_chunks,
      similarity: match.similarity
    }
  }));
}
const embeddingModel = voyage.textEmbeddingModel('voyage-3-large', {
  inputType: 'query',
  truncation: false,
  outputDimension: 1024,
  outputDtype: 'int8'
});

async function embedQuery(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text
  });
  return embedding;
}

async function getSelectedDocumentsMetadata(
  userId: string,
  selectedFiles: string[]
) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('vector_documents')
    .select('title, ai_title, ai_description, ai_maintopics, primary_language')
    .eq('user_id', userId)
    .in('filter_tags', selectedFiles)
    .eq('page_number', 1);

  if (error) {
    console.error('Error fetching document metadata:', error);
    return [];
  }

  return data;
}

// Update the uploadFilesAndQuery function
export async function uploadFilesAndQuery(
  currentUserMessage: string,
  chatId: string,
  model_select: 'claude3' | 'chatgpt4',
  selectedFiles: string[]
): Promise<SubmitMessageResult> {
  'use server';

  const CurrentChatSessionId = chatId || uuidv4();
  const aiState = getMutableAIState<AI>();
  const status = createStreamableValue('searching');
  const userInfo = await getUserInfo();

  if (!userInfo) {
    status.done('done');
    return {
      success: false,
      message: 'User not found. Please try again later.',
      limit: 0,
      remaining: 0,
      reset: 0,
      status: status.value
    };
  }
  aiState.update([
    ...aiState.get(),
    {
      role: 'user',
      content: currentUserMessage
    }
  ]);

  const uiStream = createStreamableUI(
    <div className="flex justify-center items-center mb-2 p-2 rounded-xl bg-gray-100 bg-gradient-to-r from-[#e0eaFC] to-[#cfdef3] shadow-md transition-colors hover:bg-gray-200">
      <p className="text-gray-600 italic">
        Searching for relevant information...
      </p>
      <Loader2 className="animate-spin" />
    </div>
  );

  const sanitizedFilenames = selectedFiles.map((filename) => {
    // Split the filename and timestamp
    const [name, timestamp] = filename.split('[[');

    // Sanitize only the filename part
    const sanitizedName = sanitizeFilename(name);

    // Reconstruct the filename with the original timestamp
    return timestamp ? `${sanitizedName}[[${timestamp}` : sanitizedName;
  });

  const documentsMetadata = await getSelectedDocumentsMetadata(
    userInfo.id,
    sanitizedFilenames
  );

  // Create context for query optimization
  const documentContext = documentsMetadata
    .map((doc) => {
      const parts = [`Document Title: ${doc.title}`];
      if (doc.ai_title) parts.push(`Improved Title: ${doc.ai_title}`);
      if (doc.ai_description) parts.push(`Description: ${doc.ai_description}`);
      if (doc.ai_maintopics && Array.isArray(doc.ai_maintopics)) {
        parts.push(`Main Topics: ${doc.ai_maintopics.join(', ')}`);
      }
      if (doc.primary_language)
        parts.push(
          `Primary Language used in the document: ${doc.primary_language}`
        );
      return parts.join('\n');
    })
    .join('\n\n');

  // Generate optimized queries
  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    system: `You are an expert in information retrieval. Your task is to reformulate the user's query to optimize search results for vector similarity search.
    
Available documents context:
${documentContext}

Generate three variations of the query that:
1. Precisely identifies the main topic or key concept, matching terminology from the available documents
2. Focuses on the context or domain relevant to the question
3. Explores potential applications or implications of the topic

Keep the variations focused on the content available in the provided documents.`,
    schema: zodSchemaSearch,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'improve_general',
      metadata: {
        userId: userInfo.id,
        chatId: CurrentChatSessionId,
        isNewChat: !chatId
      },
      recordInputs: true,
      recordOutputs: true
    },
    messages: [
      ...aiState
        .get()
        .slice(-7) // Limit to the last 7 messages to avoid overwhelming the model
        .map((info) => ({
          role: info.role,
          content: info.content,
          name: info.name
        }))
    ]
  });

  // Process each query variation
  const queries = [object.variation1, object.variation2, object.variation3];
  console.log('Optimized queries:', queries);
  const dataStream = createStreamableValue();
  (async () => {
    uiStream.update(
      <div className="flex flex-col justify-center items-center mb-8 mt-8 p-8 rounded-xl bg-gradient-to-br from-[#e0eaFC] to-[#cfdef3] shadow-md transition-colors hover:bg-gray-200">
        <h3 className="text-xl font-semibold text-primary mb-4">
          I&apos;ve identified these optimized search variations to better
          understand your query:
        </h3>

        <ul className="w-full space-y-3">
          {queries.map((query, index) => (
            <li key={index} className="flex items-center">
              <Search className="h-5 w-5 text-primary mr-3 shrink-0" />
              <span className="italic">{query}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center mt-8">
          <p className="text-muted-foreground italic">
            Analyzing results to provide a comprehensive response...
          </p>
          <Loader2 className="h-5 w-5 ml-2 animate-spin" />
        </div>
      </div>
    );
    const embeddings = await Promise.all(
      queries.map((query) => embedQuery(query))
    );

    // Create array of promises for vector searches
    const searchResultsPromises = await Promise.all(
      embeddings.map(
        (embedding) =>
          querySupabaseVectors(
            embedding,
            userInfo.id,
            sanitizedFilenames,
            40, // Adjust topK as needed. There is a hard limit of 200 results included in the RPC.
            0.5
          ) // Adjust similarity threshold as needed. Usually do not set it higher than 0.7 since it may not find any results.
        // You can optimize the systemprompt for the new queries to improve the results.
      )
    );

    // Flatten and deduplicate results
    const allSearchResults = searchResultsPromises.flat();

    // Deduplicate results based on content and page number
    const uniqueResults = allSearchResults.reduce<typeof allSearchResults>(
      (acc, current) => {
        const isDuplicate = acc.some(
          (item) =>
            item.metadata.title === current.metadata.title &&
            item.metadata.page === current.metadata.page
        );
        if (!isDuplicate) {
          acc.push(current);
        }
        return acc;
      },
      []
    );

    const searchResults = uniqueResults.sort(
      (a, b) => b.metadata.similarity - a.metadata.similarity
    );

    const formattedSearchResults = (() => {
      // Group results by document (using title and timestamp as identifier)
      const groupedResults = searchResults.reduce<
        Record<string, typeof searchResults>
      >((acc, result) => {
        const key = `${result.metadata.title}[[${result.metadata.timestamp}]]`;
        acc[key] ??= []; // Using nullish coalescing assignment
        acc[key].push(result);
        return acc;
      }, {});

      // Sort and format each group
      return Object.entries(groupedResults)
        .map(([_key, docs]) => {
          // Sort documents by page number
          docs.sort((a, b) => a.metadata.page - b.metadata.page);

          // Extract common metadata (only once per document)
          const {
            ai_title,
            ai_description,
            ai_maintopics,
            ai_keyentities,
            title,
            timestamp
          } = docs[0].metadata;

          // Format the document group
          return `
<document>
  <metadata>
    <title>${title}</title>
    <timestamp>${timestamp}</timestamp>
    <ai_title>${ai_title}</ai_title>
    <ai_description>${ai_description}</ai_description>
    <ai_maintopics>${ai_maintopics}</ai_maintopics>
    <ai_keyentities>${ai_keyentities}</ai_keyentities>
  </metadata>
  <content>
    ${docs
      .map(
        (doc) => `
    <page number="${doc.metadata.page}">
      <reference_link>[${doc.metadata.title}, s.${
          doc.metadata.page
        }](<?pdf=${doc.metadata.title.replace(/ /g, '_').trim()}&p=${
          doc.metadata.page
        }>)</reference_link>
      <text>${doc.pageContent}</text>
    </page>`
      )
      .join('')}
  </content>
</document>`;
        })
        .join('\n');
    })();

    const systemPromptTemplate = (() => {
      // Get actual document examples from search results
      const documentExamples = searchResults
        .slice(0, 2)
        .map(
          (result) =>
            `[${result.metadata.title}, s.${
              result.metadata.page
            }](<?pdf=${result.metadata.title.replace(/ /g, '_').trim()}&p=${
              result.metadata.page
            }>)`
        )
        .join(' and ');
      return `
<instructions>
Based on the content in the search results extracted from the uploaded files, please provide an answer to the question. The search results contain information relevant to the query.

IMPORTANT: Every time you use information from the documents, you must immediately add a reference after the relevant information. The reference MUST be in Markdown link format and include the document title and page number as a search parameter.

The Markdown link format must be exactly as follows:

[Document title, p.X](<?pdf=Document_title&p=X>)

where X is the page number.

For example:
"The law states that... ${documentExamples}"

This Markdown link format is crucial as it makes the references clickable and leads directly to the relevant page in the document. Please use this Markdown reference format consistently throughout your answer.

If the given content does not seem to contain sufficient information to answer the question, please suggest asking the question differently or provide more context. Do your best to help based on the available information.

If relevant information cannot be found to answer the question, please inform about this and suggest a rephrasing or request additional details.

Please respond in the same language as the user's question.
</instructions>

<search_results>
${formattedSearchResults}
</search_results>
`;
    })();

    const { textStream } = streamText({
      model: getModel(model_select),
      system: systemPromptTemplate,
      messages: [
        ...aiState
          .get()
          .slice(-7) // Limit to the last 7 messages to avoid overwhelming the model
          .map((info) => ({
            role: info.role,
            content: info.content,
            name: info.name
          }))
      ],
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'chat_to_pdf',
        metadata: {
          userId: userInfo.id,
          chatId: CurrentChatSessionId,
          isNewChat: !chatId
        },
        recordInputs: true,
        recordOutputs: true
      },
      onFinish: async (event) => {
        const { usage, text } = event;
        const { promptTokens, completionTokens, totalTokens } = usage;
        console.log('Prompt Tokens:', promptTokens);
        console.log('Completion Tokens:', completionTokens);
        console.log('Total Tokens:', totalTokens);
        await saveChatToSupbabase(
          CurrentChatSessionId,
          userInfo.id,
          currentUserMessage,
          text
        );

        aiState.done([...aiState.get(), { role: 'assistant', content: text }]);
      }
    });

    let isFirstChunk = true;

    for await (const textDelta of textStream) {
      if (isFirstChunk) {
        // Only create the UI stream when we receive the first chunk
        uiStream.update(<BotMessage textStream={dataStream.value} />);
        isFirstChunk = false;
      }
      dataStream.append(textDelta);
    }
    // We update here to prevent the UI from flickering
    uiStream.update(<BotMessage textStream={dataStream.value} />);

    dataStream.done();
    uiStream.done();
    status.done('done');
  })().catch((e: unknown) => {
    console.error('Error in chat handler:', e);
    uiStream.error(
      <div className="flex justify-center items-center mb-2 p-2 rounded-xl bg-red-100 text-red-800 bg-gradient-to-r from-[#FFCCCB] to-[#FFB6C1] shadow-md transition-colors hover:bg-red-200">
        <p>
          An error occurred while processing your request. Please try again
          later.
        </p>
      </div>
    );
    status.done('done');
  });

  return {
    id: generateId(),
    display: uiStream.value,
    chatId: CurrentChatSessionId,
    status: status.value
  };
}
