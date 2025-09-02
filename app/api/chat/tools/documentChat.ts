// app/api/chat/tools/documentChat.ts
import { tool } from 'ai';
import { z } from 'zod';
import { embed } from 'ai';
import { voyage } from 'voyage-ai-provider';
import { createServerSupabaseClient } from '@/lib/server/server';

const embeddingModel = voyage.textEmbeddingModel('voyage-3-large');
// Embedding model for query

interface ChatwithDocsProps {
  userId: string;
  selectedBlobs: string[];
}

// Embed query function
async function embedQuery(text: string) {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text,
    providerOptions: {
      voyage: {
        inputType: 'query',
        truncation: false,
        outputDimension: 1024,
        outputDtype: 'int8'
      }
    }
  });
  return embedding;
}

// Function to query Supabase vectors with new RPC
async function querySupabaseVectors(
  queryEmbedding: number[],
  userId: string,
  selectedFiles: string[],
  topK: number,
  similarityThreshold: number
) {
  const supabase = await createServerSupabaseClient();

  // Convert embedding array to string format for query
  const embeddingString = `[${queryEmbedding.join(',')}]`;

  const { data: matches, error } = await supabase.rpc('match_documents', {
    query_embedding: embeddingString,
    match_count: topK,
    filter_user_id: userId,
    file_ids: selectedFiles,
    similarity_threshold: similarityThreshold
  });

  if (error) {
    console.error('Error querying vectors:', error);
    throw error;
  }

  return matches.map((match) => ({
    id: match.id,
    text: match.text_content,
    title: match.title,
    timestamp: match.doc_timestamp,
    ai_title: match.ai_title,
    ai_description: match.ai_description,
    ai_maintopics: match.ai_maintopics,
    ai_keyentities: match.ai_keyentities,
    page: match.page_number,
    totalPages: match.total_pages,
    similarity: match.similarity
  }));
}

export const searchUserDocument = ({
  userId,
  selectedBlobs
}: ChatwithDocsProps) =>
  tool({
    description: `Search through ${
      selectedBlobs.length
    } uploaded documents to find relevant information based on the query. ALWAYS use this tool when documents have been uploaded by the user. Currently selected documents: ${selectedBlobs.join(
      ', '
    )}`,
    inputSchema: z.object({
      // Changed from parameters to inputSchema
      query: z
        .string()
        .describe(
          'The query to search for relevant information in the documents'
        )
    }),
    outputSchema: z.object({
      systemPrompt: z.string().describe('System prompt for the AI model')
    }),
    execute: async ({ query }, { messages }) => {
      // Changed from (args, { messages })
      // Get both query sources
      const toolQuery = query; // Changed from args.query
      const userMessage = messages[messages.length - 1].content;

      // Process both queries in parallel
      const [toolQueryEmbedding, userMessageEmbedding] = await Promise.all([
        embedQuery(toolQuery),
        embedQuery(userMessage.toString())
      ]);

      // Search vectors with both embeddings in parallel
      const [toolQueryResults, userMessageResults] = await Promise.all([
        querySupabaseVectors(
          toolQueryEmbedding,
          userId,
          selectedBlobs,
          30,
          0.3
        ),
        querySupabaseVectors(
          userMessageEmbedding,
          userId,
          selectedBlobs,
          30,
          0.3
        )
      ]);

      // Combine results from both searches
      const allSearchResults = [...toolQueryResults, ...userMessageResults];

      // Deduplicate results based on title and page number
      const seenKeys = new Set();
      const searchResults = allSearchResults.filter((item) => {
        const key = `${item.title}-${item.page}`;
        if (seenKeys.has(key)) return false;
        seenKeys.add(key);
        return true;
      });

      // Sort by similarity score (higher = more relevant)
      searchResults.sort((a, b) => b.similarity - a.similarity);

      // Format search results
      const formattedSearchResults = (() => {
        // Group results by document (using title and timestamp as identifier)
        const groupedResults = searchResults.reduce((acc, result) => {
          const key = `${result.title}[[${result.timestamp}]]`;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(result);
          return acc;
        }, {} as Record<string, typeof searchResults>);

        // Sort and format each group
        return Object.entries(groupedResults)
          .map(([_key, docs]) => {
            // Sort documents by page number
            docs.sort((a, b) => (a.page as number) - (b.page as number));

            // Extract common metadata (only once per document)
            const {
              ai_title,
              ai_description,
              ai_maintopics,
              ai_keyentities,
              title,
              timestamp
            } = docs[0];

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
          <page number="${doc.page}">
            <reference_link>[${doc.title}, p.${
                doc.page
              }](<?pdf=${doc.title.trim()}&p=${doc.page}>)</reference_link>
            <text>${doc.text}</text>
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
        return `
        <instructions>

        Based on the content of the search results, which are extracted from the uploaded files, please provide an answer to the question. The search results contain information that is relevant to the query.

        IMPORTANT: Every time you use information from the documents, you must immediately add a reference after the relevant information. The reference MUST be in Markdown link format with a contextually meaningful link text.

        The Markdown link format should be:

        [Short description or context](<?pdf=Document_title&p=X>)

        where X is the page number and "Short description or context" is meaningful text that relates to the content.

        Good examples of link text:
        - [Section §12 of the law](<?pdf=Document_title&p=8>)
        - [Figure 3.2](<?pdf=Document_title&p=15>)
        - [Definition of the concept](<?pdf=Document_title&p=2>)

        This Markdown link format is crucial as it makes the references clickable and leads directly to the relevant page in the document. Please use this Markdown reference format consistently throughout your response, but make sure the link text is short and contextually relevant instead of the entire filename.

        If the given content does not seem to contain sufficient information to answer the question, please suggest rephrasing the question or providing more context. Do your best to help based on the available information.

        If no relevant information can be found to answer the question, you should inform about this and suggest a reformulation or request additional details.

        Please respond in the same language as the user's question.
        </instructions>

        <search_results>
        ${formattedSearchResults}
        </search_results>
        `;
      })();

      // Extract document results metadata for UI
      const documentResults = Object.entries(
        searchResults.reduce(
          (acc, result) => {
            const key = result.id;
            if (!acc[key]) {
              acc[key] = {
                title: result.title,
                timestamp: result.timestamp,
                aiTitle: result.ai_title,
                pages: new Set()
              };
            }
            acc[key].pages.add(result.page);
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
            `[View document: ${
              doc.aiTitle || doc.title.substring(0, 30)
            }...](<?pdf=${doc.title.trim()}&p=1>)`
        )
        .join('\n');

      // Prepare final system prompt
      const finalSystemPrompt =
        documentResults.length > 0
          ? `I have found ${documentResults.length} relevant documents that match the user's query.

${systemPromptTemplate}

For each document that is relevant to the user's question, provide a clear and concise answer based on the document's content, and include links to the documents with contextual descriptions:
${exampleLinks}
`
          : `Unfortunately, I could not find documents that match the user's query.`;
      return {
        systemPrompt: finalSystemPrompt
      };
    }
  });
