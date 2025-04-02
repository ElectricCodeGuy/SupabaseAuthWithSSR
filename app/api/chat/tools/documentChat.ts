// app/api/chat/tools/UploadedDocumentTool.ts
import { tool } from 'ai';
import { z } from 'zod';
import { embed, generateObject } from 'ai';
import { voyage } from 'voyage-ai-provider';
import { createServerSupabaseClient } from '@/lib/server/server';
import { openai } from '@ai-sdk/openai';

// Function to sanitize filenames
function sanitizeFilename(filename: string): string {
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

interface DocToolProps {
  userId: string;
  selectedFiles: string[];
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

// Embedding model for query
const embeddingModel = voyage.textEmbeddingModel('voyage-3-large', {
  inputType: 'query',
  truncation: false,
  outputDimension: 1024,
  outputDtype: 'int8'
});

// Embed query function
async function embedQuery(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text
  });
  return embedding;
}

// Function to query Supabase vectors
async function querySupabaseVectors(
  queryEmbedding: number[],
  userId: string,
  selectedFiles: string[],
  topK = 40, // number of top matches to return
  similarityThreshold = 0.3 // similarity threshold for filtering results
) {
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

// Get document metadata for displaying in the UI
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

export const searchUserDocument = ({ userId, selectedFiles }: DocToolProps) =>
  tool({
    description: `Search through ${
      selectedFiles.length
    } uploaded documents to find relevant information based on the query. ALWAYS use this tool when documents have been uploaded by the user. Currently selected documents: ${selectedFiles.join(
      ', '
    )}`,
    parameters: z.object({
      query: z
        .string()
        .describe(
          'The query to search for relevant information in the documents'
        )
    }),
    execute: async (args, { messages }) => {
      // Sanitize filenames
      const sanitizedFilenames = selectedFiles.map((filename) => {
        // Split the filename and timestamp
        const [name, timestamp] = filename.split('[[');

        // Sanitize only the filename part
        const sanitizedName = sanitizeFilename(name);

        // Reconstruct the filename with the original timestamp
        return timestamp ? `${sanitizedName}[[${timestamp}` : sanitizedName;
      });

      // Get document metadata
      const documentsMetadata = await getSelectedDocumentsMetadata(
        userId,
        sanitizedFilenames
      );

      const documentContext = documentsMetadata
        .map((doc) => {
          const parts = [`Document Title: ${doc.title}`];
          if (doc.ai_title) parts.push(`Improved Title: ${doc.ai_title}`);
          if (doc.ai_description)
            parts.push(`Description: ${doc.ai_description}`);
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
        messages: messages
      });
      const queries = [
        object.variation1,
        object.variation2,
        object.variation3
      ].filter((q) => q && q.trim() !== '');

      console.log('Optimized queries:', queries);

      // Get embedding for each query
      const embeddings = await Promise.all(
        queries.map((query) => embedQuery(query))
      );

      // Query for vector search results for each embedding
      const searchResultsArrays = await Promise.all(
        embeddings.map((embedding) =>
          querySupabaseVectors(embedding, userId, sanitizedFilenames, 40, 0.5)
        )
      );

      // Sort results by similarity
      const allSearchResults = searchResultsArrays.flat();

      // Deduplicate results based on title and page number
      const seenKeys = new Set();
      const uniqueResults = allSearchResults.filter((item) => {
        const key = `${item.metadata.title}-${item.metadata.page}`;
        if (seenKeys.has(key)) return false;
        seenKeys.add(key);
        return true;
      });

      // Sort by similarity score
      const sortedSearchResults = uniqueResults.sort(
        (a, b) => b.metadata.similarity - a.metadata.similarity
      );

      // Format search results
      const formattedSearchResults = (() => {
        // Group results by document (using title and timestamp as identifier)
        const groupedResults = sortedSearchResults.reduce((acc, result) => {
          const key = `${result.metadata.title}[[${result.metadata.timestamp}]]`;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(result);
          return acc;
        }, {} as Record<string, typeof sortedSearchResults>);

        // Sort and format each group
        return Object.entries(groupedResults)
          .map(([_key, docs]) => {
            // Sort documents by page number
            docs.sort(
              (a, b) =>
                (a.metadata.page as number) - (b.metadata.page as number)
            );

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
    <ai_title>${ai_title || ''}</ai_title>
    <ai_description>${ai_description || ''}</ai_description>
    <ai_maintopics>${
      Array.isArray(ai_maintopics)
        ? ai_maintopics.join(', ')
        : ai_maintopics || ''
    }</ai_maintopics>
    <ai_keyentities>${
      Array.isArray(ai_keyentities)
        ? ai_keyentities.join(', ')
        : ai_keyentities || ''
    }</ai_keyentities>
  </metadata>
  <content>
    ${docs
      .map(
        (doc) => `
    <page number="${doc.metadata.page}">
      <reference_link>[${doc.metadata.title}, p.${
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

      // Create system prompt
      const systemPromptTemplate = (() => {
        // Get actual document examples from search results
        const documentExamples = sortedSearchResults
          .slice(0, 2)
          .map(
            (result) =>
              `[${result.metadata.title}, p.${
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
"The document states that... ${documentExamples}"

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

      // Extract document results metadata for UI
      const documentResults = Object.entries(
        sortedSearchResults.reduce(
          (acc, result) => {
            const key = `${result.metadata.title}[[${result.metadata.timestamp}]]`;
            if (!acc[key]) {
              acc[key] = {
                title: result.metadata.title,
                timestamp: result.metadata.timestamp,
                aiTitle: result.metadata.ai_title,
                pages: new Set()
              };
            }
            acc[key].pages.add(result.metadata.page);
            return acc;
          },
          {} as Record<
            string,
            {
              title: string;
              timestamp: string;
              aiTitle: string;
              pages: Set<number>;
            }
          >
        )
      ).map(([key, doc]) => ({
        id: key,
        title: doc.title,
        timestamp: doc.timestamp,
        aiTitle: doc.aiTitle,
        pageCount: doc.pages.size
      }));

      // Get example links for the systemprompt
      const exampleLinks = documentResults
        .slice(0, 3)
        .map(
          (doc) =>
            `[${doc.title}](<?pdf=${doc.title.replace(/ /g, '_').trim()}&p=1>)`
        )
        .join('\n');

      // Prepare final system prompt
      const finalSystemPrompt =
        documentResults.length > 0
          ? `I have found ${documentResults.length} relevant documents that match the user's query.

${systemPromptTemplate}

For each document relevant to the user's question, provide a clear and concise answer based on the document content, and include links to the documents in this format:
${exampleLinks}
`
          : `I could not find any documents matching the user's query.`;

      return {
        systemPrompt: finalSystemPrompt
      };
    }
  });
