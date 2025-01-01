import React from 'react';
import {
  createAI,
  getMutableAIState,
  createStreamableUI,
  getAIState,
  createStreamableValue,
  type StreamableValue
} from 'ai/rsc';
import {
  streamText,
  generateId,
  smoothStream,
  embed,
  generateObject
} from 'ai';
import {
  Box,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import {
  BotMessage,
  UserMessage,
  InternetSearchToolResults
} from './component/ChatWrapper';
import { v4 as uuidv4 } from 'uuid';
import { saveChatToSupbabase } from './lib/SaveToDb';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { getUserInfo, getSession } from '@/lib/server/supabase';
import { createServerSupabaseClient } from '@/lib/server/server';
import { redirect } from 'next/navigation';
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/server/server';
import { load } from 'cheerio';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import { z } from 'zod';

const SYSTEM_TEMPLATE = `You are a helpful assistant. Answer all questions to the best of your ability. Provide helpful answers in markdown.`;

const getModel = (selectedModel: 'claude3' | 'chatgpt4') => {
  if (selectedModel === 'claude3') {
    return anthropic('claude-3-5-sonnet-20241022');
  } else if (selectedModel === 'chatgpt4') {
    return openai('gpt-4o');
  }
  return anthropic('claude-3-5-sonnet-20241022');
};

async function submitMessage(
  currentUserMessage: string,
  model_select: 'claude3' | 'chatgpt4',
  chatId: string
): Promise<SubmitMessageResult> {
  'use server';

  const CurrentChatSessionId = chatId || uuidv4();

  const aiState = getMutableAIState<typeof AI>();
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
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '24h') // 30 msg per 24 hours
  });
  const { success, limit, reset, remaining } = await ratelimit.limit(
    `ratelimit_${userInfo.id}`
  );
  if (!success) {
    status.done('done');
    console.log('Rate limit exceeded. Please try again later.');
    console.log('Limit:', limit);
    console.log('Remaining:', remaining);
    console.log('Reset:', reset);
    return {
      success: false,
      message: 'Rate limit exceeded. Please try again later.',
      limit,
      remaining,
      reset,
      status: status.value
    };
  }
  // Update AI state with new message.
  aiState.update([
    ...aiState.get(),
    {
      role: 'user',
      content: currentUserMessage
    }
  ]);

  const uiStream = createStreamableUI(
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        mb: 2,
        p: 2,
        borderRadius: 4,
        bgcolor: 'grey.100',
        backgroundImage: 'linear-gradient(45deg, #e0eaFC #cfdef3)',
        boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
        transition: 'background-color 0.3s ease',

        ':hover': {
          bgcolor: 'grey.200'
        }
      }}
    >
      <Typography
        variant="body1"
        sx={{
          color: 'textSecondary',
          fontStyle: 'italic'
        }}
      >
        Searching...
      </Typography>
    </Box>
  );

  (async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate a delay

    uiStream.update(
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mb: 2,
          p: 2,
          borderRadius: 4,
          bgcolor: 'grey.100',
          backgroundImage: 'linear-gradient(45deg, #e0eaFC #cfdef3)',
          boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
          transition: 'background-color 0.3s ease',

          ':hover': {
            bgcolor: 'grey.200'
          }
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: 'textSecondary',
            fontStyle: 'italic'
          }}
        >
          Found relevant website. Scraping data...
        </Typography>
        <CircularProgress size={20} sx={{ marginLeft: 2 }} />
      </Box>
    );

    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate a delay

    uiStream.update(
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mb: 2,
          p: 2,
          borderRadius: 4,
          bgcolor: 'grey.100',
          backgroundImage: 'linear-gradient(45deg, #e0eaFC #cfdef3)',
          boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
          transition: 'background-color 0.3s ease',

          ':hover': {
            bgcolor: 'grey.200'
          }
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: 'textSecondary',
            fontStyle: 'italic'
          }}
        >
          Analyzing scraped data...
        </Typography>
        <CircularProgress size={20} sx={{ marginLeft: 2 }} />
      </Box>
    );

    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate a delay

    uiStream.update(
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mb: 2,
          p: 2,
          borderRadius: 4,
          bgcolor: 'grey.100',
          backgroundImage: 'linear-gradient(45deg, #e0eaFC #cfdef3)',
          boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
          transition: 'background-color 0.3s ease',

          ':hover': {
            bgcolor: 'grey.200'
          }
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: 'textSecondary',
            fontStyle: 'italic'
          }}
        >
          Generating response...
        </Typography>
        <CircularProgress size={20} sx={{ marginLeft: 2 }} />
      </Box>
    );

    const { textStream } = streamText({
      model: getModel(model_select),
      maxTokens: 4000,
      temperature: 0,
      frequencyPenalty: 0.5,
      system: SYSTEM_TEMPLATE,
      experimental_transform: smoothStream({ delayInMs: 20 }),
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
      onFinish: async (event) => {
        const { text, usage } = event;
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

        aiState.done([
          ...aiState.get(),
          { role: 'assistant', content: fullResponse }
        ]);
        /*  If you want to track the usage of the AI model, you can use the following code:'
      import { track } from '@vercel/analytics/server';
        track('ailoven', {
          systemPromptTemplate,
          currnetUserMessage,
          fullResponse: text,
          promptTokens,
          completionTokens,
          totalTokens
        });
      }
      Check out Vercel track functionallity
          */
      }
    });

    let fullResponse = '';
    for await (const textDelta of textStream) {
      fullResponse += textDelta;
      uiStream.update(<BotMessage>{fullResponse}</BotMessage>);
    }

    uiStream.done();
    status.done('done');
  })().catch((e) => {
    console.error('Error in chat handler:', e);
    uiStream.error(
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mb: 2,
          p: 2,
          borderRadius: 4,
          bgcolor: 'error.light',
          color: 'error.contrastText',
          backgroundImage: 'linear-gradient(45deg, #FFCCCB, #FFB6C1)',
          boxShadow: '0 3px 5px 2px rgba(255, 0, 0, .1)',
          transition: 'background-color 0.3s ease',
          ':hover': {
            bgcolor: 'error.main'
          }
        }}
      >
        <Typography variant="body1">
          An error occurred while processing your request. Please try again
          later.
        </Typography>
      </Box>
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

type ResetResult = {
  success: boolean;
  message: string;
};
async function resetMessages(): Promise<ResetResult> {
  'use server';

  const session = await getSession();
  if (!session) {
    return {
      success: false,
      message: 'Error: User not found. Please try again later.'
    };
  }

  const aiState = getMutableAIState<typeof AI>();

  try {
    // Clear all messages from the AI state

    // Clear all messages from the AI state by setting it to an empty array
    aiState.update([]);

    // Call done to finalize the state update
    aiState.done([]);
  } catch (error) {
    console.error('Error resetting chat messages:', error);
    return {
      success: false,
      message:
        'Error resetting chat messages. Please try again later or contact support.'
    };
  }
  redirect('/actionchat');
}

function sanitizeFilename(filename: string): string {
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function querySupabaseVectors(
  queryEmbedding: number[],
  userId: string,
  selectedFiles: string[],
  topK: number = 40,
  similarityThreshold: number = 0.78
): Promise<
  Array<{
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
  }>
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

  return (
    matches?.map((match) => ({
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
    })) || []
  );
}

async function embedQuery(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-large'),
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

  return data || [];
}

// Update the uploadFilesAndQuery function
async function uploadFilesAndQuery(
  currentUserMessage: string,
  chatId: string,
  model_select: 'claude3' | 'chatgpt4',
  selectedFiles: string[]
): Promise<SubmitMessageResult> {
  'use server';

  const CurrentChatSessionId = chatId || uuidv4();
  const aiState = getMutableAIState<typeof AI>();
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
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        mb: 2,
        p: 2,
        borderRadius: 4,
        bgcolor: 'grey.100',
        backgroundImage: 'linear-gradient(45deg, #e0eaFC #cfdef3)',
        boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
        transition: 'background-color 0.3s ease',

        ':hover': {
          bgcolor: 'grey.200'
        }
      }}
    >
      <Typography
        variant="body1"
        sx={{
          color: 'textSecondary',
          fontStyle: 'italic'
        }}
      >
        Searching...
      </Typography>
    </Box>
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
  (async () => {
    uiStream.update(
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        mb={2}
        mt={2}
        p={2}
        borderRadius={4}
        bgcolor="grey.100"
        sx={{
          backgroundImage: 'linear-gradient(45deg, #e0eaFC, #cfdef3)',
          boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
          transition: 'background-color 0.3s ease',
          ':hover': {
            bgcolor: 'grey.200'
          }
        }}
      >
        <Typography variant="h6" color="primary" gutterBottom>
          I&apos;ve identified these optimized search variations to better
          understand your query:
        </Typography>

        <List sx={{ width: '100%' }}>
          {queries.map((query, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <SearchIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary={query} sx={{ fontStyle: 'italic' }} />
            </ListItem>
          ))}
        </List>

        <Box display="flex" alignItems="center" mt={2}>
          <Typography variant="body1" color="textSecondary" fontStyle="italic">
            Analyzing results to provide a comprehensive response...
          </Typography>
          <CircularProgress size={20} sx={{ marginLeft: 2 }} />
        </Box>
      </Box>
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
    const uniqueResults = allSearchResults.reduce(
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
      [] as typeof allSearchResults
    );

    const searchResults = uniqueResults.sort(
      (a, b) => b.metadata.similarity - a.metadata.similarity
    );

    const formattedSearchResults = (() => {
      // Group results by document (using title and timestamp as identifier)
      const groupedResults = searchResults.reduce(
        (acc, result) => {
          const key = `${result.metadata.title}[[${result.metadata.timestamp}]]`;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(result);
          return acc;
        },
        {} as Record<string, typeof searchResults>
      );

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
      <reference_link>[${doc.metadata.title}, s.${doc.metadata.page}](<?pdf=${doc.metadata.title.replace(/ /g, '_').trim()}&p=${doc.metadata.page}>)</reference_link>
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
            `[${result.metadata.title}, s.${result.metadata.page}](<?pdf=${result.metadata.title.replace(/ /g, '_').trim()}&p=${result.metadata.page}>)`
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
      experimental_transform: smoothStream({ delayInMs: 20 }),
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

        aiState.done([
          ...aiState.get(),
          { role: 'assistant', content: fullResponse }
        ]);
      }
    });

    let fullResponse = '';
    for await (const textDelta of textStream) {
      fullResponse += textDelta;
      uiStream.update(<BotMessage>{fullResponse}</BotMessage>);
    }
    uiStream.done();
    status.done('done');
  })().catch((e) => {
    console.error('Error in chat handler:', e);
    uiStream.error(
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mb: 2,
          p: 2,
          borderRadius: 4,
          bgcolor: 'error.light',
          color: 'error.contrastText',
          backgroundImage: 'linear-gradient(45deg, #FFCCCB, #FFB6C1)',
          boxShadow: '0 3px 5px 2px rgba(255, 0, 0, .1)',
          transition: 'background-color 0.3s ease',
          ':hover': {
            bgcolor: 'error.main'
          }
        }}
      >
        <Typography variant="body1">
          An error occurred while processing your request. Please try again
          later.
        </Typography>
      </Box>
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

type TavilySearchResult = {
  title: string;
  url: string;
  content: string;
  raw_content: string;
  score: number;
};

type TavilyAPIResponse = {
  answer: string;
  query: string;
  response_time: string;
  follow_up_questions: string[];
  images: string[];
  results: TavilySearchResult[];
};

// Type for our processed search result
type ProcessedSearchResult = {
  title: string;
  url: string;
  content: string;
};
const zodSchemaSearch = z
  .object({
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
  })
  .required();

interface SearchResult {
  title: string;
  url: string;
  content: string;
}
async function SearchTool(
  currentUserMessage: string,
  model_select: 'claude3' | 'chatgpt4',
  chatId: string
): Promise<SearchToolResult> {
  'use server';

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
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '24h') // 30 msg per 24 hours
  });
  const { success, limit, reset, remaining } = await ratelimit.limit(
    `ratelimit_${userInfo.id}`
  );
  if (!success) {
    status.done('done');
    console.log('Rate limit exceeded. Please try again later.');
    console.log('Limit:', limit);
    console.log('Remaining:', remaining);
    console.log('Reset:', reset);
    return {
      success: false,
      message: 'Rate limit exceeded. Please try again later.',
      limit,
      remaining,
      reset,
      status: status.value
    };
  }

  const CurrentChatSessionId = chatId || uuidv4();

  // Initialize AI state with user's message
  const aiState = getMutableAIState<typeof AI>();
  aiState.update([
    ...aiState.get(),
    {
      role: 'user',
      content: currentUserMessage
    }
  ]);

  // Create initial UI for search process
  const stream = createStreamableUI(
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      mb={2}
      p={2}
      borderRadius={4}
      bgcolor="grey.100"
      sx={{
        backgroundImage: 'linear-gradient(45deg, #e0eaFC #cfdef3)',
        boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
        transition: 'background-color 0.3s ease',
        ':hover': {
          bgcolor: 'grey.200'
        }
      }}
    >
      <Typography variant="body1" color="textSecondary" fontStyle="italic">
        Searching for relevant information...
      </Typography>
      <CircularProgress size={20} sx={{ marginLeft: 2 }} />
    </Box>
  );
  let searchResults: SearchResult[] = [];

  const nhm = new NodeHtmlMarkdown();
  (async () => {
    // Prompt to generate search query variations
    const contextualizeQSystemPrompt = `
    As an expert in information retrieval, reformulate the user's query to optimize search results. Include the user's original question.
  
    The goal is to produce reformulated questions that capture the essence of the query and generate optimized search terms.
  
    Also generate variations of the query to improve search results and find the most up-to-date information. The variations should focus on:
    1. Precisely identifying the main topic or key concept.
    2. Focusing on the relevant context or domain.
    3. Exploring potential applications or implications of the topic.
  
    All questions and variations should be in English.
  
    Original question: ${currentUserMessage}
  `;

    // Generate search query variations using AI
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: contextualizeQSystemPrompt,
      schema: zodSchemaSearch,
      mode: 'json',
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

    // Filter out empty queries
    const searchQueries = [
      object.variation1,
      object.variation2,
      object.variation3
    ].filter((query) => query !== undefined && query.trim() !== '');
    stream.update(
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        mb={2}
        mt={2}
        p={2}
        borderRadius={4}
        bgcolor="grey.100"
        sx={{
          backgroundImage: 'linear-gradient(45deg, #e0eaFC, #cfdef3)',
          boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
          transition: 'background-color 0.3s ease',
          ':hover': {
            bgcolor: 'grey.200'
          }
        }}
      >
        <Typography variant="h6" color="primary" gutterBottom>
          I&apos;ve identified these optimized search variations to better
          understand your query:
        </Typography>

        <List sx={{ width: '100%' }}>
          {searchQueries.map((query, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <SearchIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary={query} sx={{ fontStyle: 'italic' }} />
            </ListItem>
          ))}
        </List>

        <Box display="flex" alignItems="center" mt={2}>
          <Typography variant="body1" color="textSecondary" fontStyle="italic">
            Analyzing results to provide a comprehensive response...
          </Typography>
          <CircularProgress size={20} sx={{ marginLeft: 2 }} />
        </Box>
      </Box>
    );
    // Perform Tavily search for each query variation
    // Note: This approach uses multiple queries, which can provide better results but is more expensive.
    // Consider your monthly API limit when using this method.
    // This method of creating new queries can be applied to RAG aswell to improve the extraction of data out of a Vector Database.
    const searchPromises = searchQueries.map(async (query) => {
      const response = await fetch('https://api.tavily.com/search', {
        cache: 'no-store',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query,
          search_depth: 'advanced',
          include_answer: false,
          include_images: false,
          include_raw_content: false,
          max_results: 2
        })
      });

      const data: TavilyAPIResponse = await response.json();

      // Process each search result
      return Promise.all(
        data.results.map(
          async (
            result: TavilySearchResult
          ): Promise<ProcessedSearchResult> => {
            try {
              // Attempt to fetch and parse content
              const contentResponse = await fetch(result.url, {
                cache: 'no-store'
              });

              if (!contentResponse.ok) {
                // If fetch fails, fall back to Tavily content
                return {
                  title: result.title,
                  url: result.url,
                  content: result.content // Use Tavily's content as fallback
                };
              }

              const contentHtml = await contentResponse.text();
              const $ = load(contentHtml);
              const contentRAW = $('body')
                .clone()
                .find('script, style, nav, header, footer, iframe, noscript')
                .remove()
                .end()
                .text()
                .replace(/\s+/g, ' ')
                .trim();

              // Convert to markdown with proper sanitization
              const content = nhm.translate(contentRAW);

              return {
                title: result.title,
                url: result.url,
                content: content || result.content // Use parsed content if available, otherwise fall back to Tavily content
              };
            } catch (error) {
              console.error(`Error fetching content for ${result.url}:`, error);
              // Fall back to Tavily content on any error
              return {
                title: result.title,
                url: result.url,
                content: result.content // Use Tavily's content as fallback
              };
            }
          }
        )
      );
    });
    // Combine and deduplicate search results
    const searchResultsArray = await Promise.all(searchPromises);
    const uniqueSearchResults = searchResultsArray
      .flat()
      .reduce((acc, result) => {
        if (!acc.some((r: SearchResult) => r.url === result.url)) {
          acc.push(result);
        }
        return acc;
      }, [] as SearchResult[]);

    searchResults = uniqueSearchResults;

    // Update UI with search results and preparation message
    stream.update(
      <>
        <InternetSearchToolResults searchResults={searchResults} />
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          mb={2}
          mt={2}
          p={2}
          borderRadius={4}
          bgcolor="grey.100"
          sx={{
            backgroundImage: 'linear-gradient(45deg, #e0eaFC, #cfdef3)',
            boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
            transition: 'background-color 0.3s ease',
            ':hover': {
              bgcolor: 'grey.200'
            }
          }}
        >
          <Typography variant="body1" color="textSecondary" fontStyle="italic">
            Preparing response...
          </Typography>
          <CircularProgress size={20} sx={{ marginLeft: 2 }} />
        </Box>
      </>
    );

    // Format search results for AI prompt
    const formattedSearchResults = searchResults
      .map(
        (result) =>
          `<result>
        <title>${result.title}</title>
        <url>${result.url}</url>
        <content>${result.content}</content>
      </result>`
      )
      .join('\n');

    // Create system prompt for AI to generate response
    const systemPromptTemplate = `
<search_results>
${formattedSearchResults}
</search_results>

<instructions>
Based on the search results, provide a comprehensive and well-structured response to the user's question following these guidelines:

1. Format & Structure:
   - Break down complex information into clear paragraphs
   - Use bullet points when listing multiple items
   - Ensure the response flows logically

2. Source Citation:
   - Cite sources immediately after each claim or piece of information using: [Source Title](URL)
   - Do not group citations at the end
   - Use direct quotes sparingly and when particularly relevant


If the search results are insufficient or unclear:
- Acknowledge the limitations
- Specify what additional information would be helpful
- Suggest how the user might rephrase their question

Remember to maintain a professional yet conversational tone throughout the response.
</instructions>
`;
    console.log('Search Results:', systemPromptTemplate);
    // Generate AI response based on search results
    const { textStream } = streamText({
      model: getModel(model_select),
      system: systemPromptTemplate,
      experimental_transform: smoothStream({ delayInMs: 20 }),
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
      onFinish: async (event) => {
        const { usage, text } = event;
        const { promptTokens, completionTokens, totalTokens } = usage;
        console.log('Prompt Tokens:', promptTokens);
        console.log('Completion Tokens:', completionTokens);
        console.log('Total Tokens:', totalTokens);
        const formattedSources = searchResults.map((result) => ({
          title: result.title,
          url: result.url
        }));

        await saveChatToSupbabase(
          CurrentChatSessionId,
          userInfo.id,
          currentUserMessage,
          text,
          formattedSources // Pass the formatted sources
        );

        aiState.done([
          ...aiState.get(),
          { role: 'assistant', content: fullResponse }
        ]);
      }
    });

    // Stream AI response to UI
    let fullResponse = '';
    for await (const textDelta of textStream) {
      fullResponse += textDelta;
      stream.update(
        <>
          <BotMessage>{fullResponse}</BotMessage>
          <InternetSearchToolResults searchResults={searchResults} />
        </>
      );
    }
    status.done('done');
    stream.done();
  })().catch((e) => {
    console.error('Error in chat handler:', e);
    stream.error(
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mb: 2,
          p: 2,
          borderRadius: 4,
          bgcolor: 'error.light',
          color: 'error.contrastText',
          backgroundImage: 'linear-gradient(45deg, #FFCCCB, #FFB6C1)',
          boxShadow: '0 3px 5px 2px rgba(255, 0, 0, .1)',
          transition: 'background-color 0.3s ease',
          ':hover': {
            bgcolor: 'error.main'
          }
        }}
      >
        <Typography variant="body1">
          An error occurred while processing your request. Please try again
          later.
        </Typography>
      </Box>
    );
    status.done('done');
  });

  return {
    id: Date.now(),
    display: stream.value,
    chatId: CurrentChatSessionId,
    status: status.value
  };
}
type Source = {
  title: string;
  url: string;
};
export type ServerMessage = {
  role: 'user' | 'assistant';
  content: string;
  name?: string;
  sources?: Source[];
};

export type ClientMessage = {
  id: string | number | null;
  role: 'user' | 'assistant';
  display: React.ReactNode;
  chatId?: string | null;
};

export type SearchToolResult = {
  success?: boolean;
  message?: string;
  limit?: number;
  remaining?: number;
  reset?: number;
  id?: number;
  display?: React.ReactNode;
  chatId?: string;
  status: StreamableValue<string, any>;
};

const initialAIState: ServerMessage[] = [];
const initialUIState: ClientMessage[] = [];

export type SubmitMessageResult = {
  success?: boolean;
  message?: string;
  limit?: number;
  remaining?: number;
  reset?: number;
  id?: string;
  display?: React.ReactNode;
  chatId?: string;
  status: StreamableValue<string, any>;
};

type Actions = {
  submitMessage: (
    currentUserMessage: string,
    model_select: 'claude3' | 'chatgpt4',
    chatId: string
  ) => Promise<SubmitMessageResult>;
  uploadFilesAndQuery: (
    currentUserMessage: string,
    chatId: string,
    model_select: 'claude3' | 'chatgpt4',
    selectedFiles: string[]
  ) => Promise<SubmitMessageResult>;
  SearchTool: (
    currentUserMessage: string,
    model_select: 'claude3' | 'chatgpt4',
    chatId: string
  ) => Promise<SearchToolResult>;
  resetMessages: () => Promise<ResetResult>;
};

export const AI = createAI<ServerMessage[], ClientMessage[], Actions>({
  actions: {
    submitMessage,
    uploadFilesAndQuery,
    SearchTool,
    resetMessages
  },
  onGetUIState: async () => {
    'use server';

    const historyFromApp = getAIState();

    if (historyFromApp) {
      const session = await getSession();
      return historyFromApp.map((message: ServerMessage) => ({
        id: generateId(),
        role: message.role,
        display:
          message.role === 'user' ? (
            <UserMessage
              full_name={session?.user_metadata.full_name || 'Unknown'}
            >
              {message.content}
            </UserMessage>
          ) : (
            <>
              <BotMessage>{message.content}</BotMessage>
              {message.sources && message.sources.length > 0 && (
                <InternetSearchToolResults searchResults={message.sources} />
              )}
            </>
          )
      }));
    } else {
      return;
    }
  },
  initialUIState,
  initialAIState
});
