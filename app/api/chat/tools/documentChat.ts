// Self-serve tool over the user's own uploaded PDF documents. The AI picks an
// action based on the user's prompt — there is no manual document selection.
import { tool } from 'ai';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/server/server';
import { voyage } from 'voyage-ai-provider';
import { embed } from 'ai';

const embeddingModel = voyage.embeddingModel('voyage-4-large');

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

interface DocMetaRow {
  id: string;
  title: string;
  ai_title: string | null;
  ai_description: string | null;
  ai_maintopics: string[] | null;
  ai_keyentities: string[] | null;
  total_pages: number | null;
}

function toDocSummary(d: DocMetaRow) {
  return {
    id: d.id,
    title: d.ai_title || d.title,
    fileName: d.title,
    description: d.ai_description ?? undefined,
    topics: d.ai_maintopics ?? undefined,
    totalPages: d.total_pages ?? undefined
  };
}

export const searchUserDocument = ({ userId }: { userId: string }) =>
  tool({
    description: `Look up and search the user's OWN uploaded PDF documents. Pick the action that fits the user's request:
- action "list": return every document the user has uploaded (id, title and AI-generated metadata). Use this to discover what is available.
- action "findByName": find documents whose name/title matches "nameQuery" (use when the user refers to a document by name and there may be many).
- action "searchContent": vector-search the actual text inside documents for "query". Pass "documentIds" to restrict to specific documents (e.g. the ones attached to the current project), or omit it to search across ALL of the user's documents.

You may call this yourself whenever the user refers to their uploaded documents — first "list"/"findByName" to locate the right document(s), then "searchContent" with their ids.`,
    inputSchema: z.object({
      action: z
        .enum(['list', 'findByName', 'searchContent'])
        .describe('Which operation to perform'),
      query: z
        .string()
        .optional()
        .describe('Content search query — required for action "searchContent"'),
      nameQuery: z
        .string()
        .optional()
        .describe('Document name to match — required for action "findByName"'),
      documentIds: z
        .array(z.string())
        .optional()
        .describe(
          "Restrict a content search to these document ids. Omit to search all of the user's documents."
        )
    }),
    execute: async ({ action, query, nameQuery, documentIds }) => {
      // Use the session client (not service-role): match_documents_5 enforces
      // auth.uid(), which is null under the admin client → "Not authorized".
      const supabase = await createServerSupabaseClient();

      if (action === 'list') {
        const { data } = await supabase
          .from('user_documents')
          .select(
            'id, title, ai_title, ai_description, ai_maintopics, ai_keyentities, total_pages'
          )
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100);
        return {
          mode: 'list' as const,
          documents: (data ?? []).map(toDocSummary)
        };
      }

      if (action === 'findByName') {
        const term = (nameQuery ?? '').trim();
        if (!term) {
          return { mode: 'findByName' as const, query: '', documents: [] };
        }
        // Quote the value so commas / parentheses in a document name don't break
        // the PostgREST .or() grammar; escape quotes + backslashes.
        const safe = term.replace(/["\\]/g, '\\$&');
        const { data } = await supabase
          .from('user_documents')
          .select(
            'id, title, ai_title, ai_description, ai_maintopics, ai_keyentities, total_pages'
          )
          .eq('user_id', userId)
          .or(`title.ilike."%${safe}%",ai_title.ilike."%${safe}%"`)
          .limit(25);
        return {
          mode: 'findByName' as const,
          query: term,
          documents: (data ?? []).map(toDocSummary)
        };
      }

      // searchContent
      const q = (query ?? '').trim();
      if (!q) {
        return { mode: 'search' as const, query: '', results: [] };
      }

      // Restrict to the given documents, or all of the user's documents.
      let fileIds = documentIds ?? [];
      if (fileIds.length === 0) {
        const { data: allDocs } = await supabase
          .from('user_documents')
          .select('id')
          .eq('user_id', userId);
        fileIds = (allDocs ?? []).map((d) => d.id);
      }
      if (fileIds.length === 0) {
        return { mode: 'search' as const, query: q, results: [] };
      }

      const embedding = await embedQuery(q);
      if (!embedding || embedding.length === 0) {
        console.warn('userDocuments search: empty embedding for query', q);
        return { mode: 'search' as const, query: q, results: [] };
      }
      const { data: matches, error } = await supabase.rpc('match_documents', {
        query_embedding: `[${embedding.join(',')}]`,
        query_text: q,
        match_count: 8,
        filter_user_id: userId,
        file_ids: fileIds,
        vector_weight: 0.6,
        k_rrf: 60
      });

      if (error) {
        console.error('userDocuments search error:', error);
        return { mode: 'search' as const, query: q, results: [] };
      }

      const results = (matches ?? []).map((m) => ({
        documentId: m.id,
        title: m.ai_title || m.title,
        fileName: m.title,
        page: m.page_number,
        totalPages: m.total_pages,
        text: m.text_content
      }));

      return { mode: 'search' as const, query: q, results };
    }
  });
