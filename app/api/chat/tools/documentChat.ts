import { tool } from 'ai';
import { z } from 'zod';
import { embed } from 'ai';
import { voyage } from 'voyage-ai-provider';
import { createServerSupabaseClient } from '@/lib/server/server';

const embeddingModel = voyage.textEmbeddingModel('voyage-3-large');

// Rough token estimate: ~4 characters per token
const MAX_CONTENT_CHARS = 40000; // ~10000 tokens

interface SearchUserDocumentProps {
  userId: string;
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

// Function to get user's document IDs
async function getUserDocumentIds(userId: string): Promise<string[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('user_documents')
    .select('id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user documents:', error);
    return [];
  }

  return data?.map((doc) => doc.id) ?? [];
}

// Function to query Supabase vectors
async function querySupabaseVectors(
  queryEmbedding: number[],
  userId: string,
  documentIds: string[],
  topK: number,
  similarityThreshold: number
) {
  const supabase = await createServerSupabaseClient();

  const embeddingString = `[${queryEmbedding.join(',')}]`;

  const { data: matches, error } = await supabase.rpc('match_documents', {
    query_embedding: embeddingString,
    match_count: topK,
    filter_user_id: userId,
    file_ids: documentIds,
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

export const searchUserDocument = ({ userId }: SearchUserDocumentProps) =>
  tool({
    description: `Search through the user's uploaded documents to find relevant information. Use this tool when the user asks questions about their documents or when you need to find specific information from their uploaded files.`,
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          'The search query to find relevant information in the documents'
        )
    }),
    outputSchema: z.object({
      instructions: z.string().describe('Instructions for the AI on how to use the search results'),
      context: z.array(z.object({
        type: z.string(),
        title: z.string(),
        aiTitle: z.string().optional(),
        page: z.number(),
        totalPages: z.number().optional(),
        content: z.string(),
        pdfLink: z.string()
      })).describe('Array of document contexts found')
    }),
    execute: async ({ query }, { messages }) => {
      // Get user's document IDs from database
      const documentIds = await getUserDocumentIds(userId);

      if (documentIds.length === 0) {
        return {
          instructions: 'The user has no uploaded documents. Please let them know they need to upload documents first before you can search through them.',
          context: []
        };
      }

      const toolQuery = query;
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
          documentIds,
          30,
          0.3
        ),
        querySupabaseVectors(
          userMessageEmbedding,
          userId,
          documentIds,
          30,
          0.3
        )
      ]);

      // Combine and deduplicate results
      const allSearchResults = [...toolQueryResults, ...userMessageResults];
      const seenKeys = new Set();
      const searchResults = allSearchResults.filter((item) => {
        const key = `${item.title}-${item.page}`;
        if (seenKeys.has(key)) return false;
        seenKeys.add(key);
        return true;
      });

      // Sort by similarity score
      searchResults.sort((a, b) => b.similarity - a.similarity);

      // Build context array for client display and AI instructions
      const contextArray = searchResults.map((result) => {
        let content = result.text || '';

        // Truncate if content exceeds max characters
        if (content.length > MAX_CONTENT_CHARS) {
          content = content.slice(0, MAX_CONTENT_CHARS);
        }

        return {
          type: 'document',
          title: result.title,
          aiTitle: result.ai_title || undefined,
          page: result.page as number,
          totalPages: result.totalPages as number | undefined,
          content: content,
          pdfLink: `<?pdf=${result.title.trim()}&p=${result.page}>`
        };
      });

      // Create instructions for the AI
      const instructions = `
Baseret på indholdet fra de fundne dokumenter skal du give et koncist og præcist svar på brugerens spørgsmål.

VIGTIGT: Hver gang du bruger information fra dokumenterne, skal du tilføje en reference i Markdown-linkformat:
[Kort beskrivelse](<?pdf=Dokument_titel&p=X>)

Gode eksempler på linktekst:
- [§12 i loven](<?pdf=Dokument_titel&p=8>)
- [Figur 3.2](<?pdf=Dokument_titel&p=15>)
- [Definition af begrebet](<?pdf=Dokument_titel&p=2>)

Hvis ingen relevant information findes, informer brugeren og foreslå en omformulering af spørgsmålet.
Svar på samme sprog som brugerens spørgsmål.

Fundne dokumenter:
${contextArray.map(doc => `- ${doc.aiTitle || doc.title} (side ${doc.page})`).join('\n')}
`;

      return {
        instructions: instructions,
        context: contextArray
      };
    }
  });
