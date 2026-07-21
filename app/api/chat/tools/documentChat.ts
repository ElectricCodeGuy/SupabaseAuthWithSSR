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

// Full-content reads are capped so a huge PDF can't blow up the context.
const MAX_CONTENT_CHARS = 60000;

export const searchUserDocument = ({ userId }: { userId: string }) =>
  tool({
    description: `Look up, read and search the user's OWN uploaded PDF documents. Pick the action that fits the user's request:
- action "list": table of contents of the user's documents, newest first, with AI-generated metadata (title, description, topics, page count). Use "limit" to get e.g. the 10 newest.
- action "findByName": find documents whose file name OR AI-generated title matches "nameQuery" (use when the user refers to a document by name/topic and there may be many).
- action "getContent": read the FULL text of one document by "documentId" (optionally a "pageStart"/"pageEnd" range). Use when the user wants a summary/review of a whole document rather than an answer to a specific question.
- action "searchContent": hybrid search (vector similarity + keyword match) inside document text for "query". Pass "documentIds" to restrict to specific documents, or omit to search ALL documents. Best for specific questions ("what does it say about X").

Typical flows: "what documents do I have" → list. "summarize my rental contract" → findByName then getContent. "what payment terms are in my contracts" → searchContent.`,
    inputSchema: z.object({
      action: z
        .enum(['list', 'findByName', 'getContent', 'searchContent'])
        .describe('Which operation to perform'),
      query: z
        .string()
        .optional()
        .describe('Content search query — required for action "searchContent"'),
      nameQuery: z
        .string()
        .optional()
        .describe(
          'Name or AI-title to match — required for action "findByName"'
        ),
      documentId: z
        .string()
        .optional()
        .describe('Document id to read — required for action "getContent"'),
      pageStart: z
        .number()
        .optional()
        .describe('First page to read (getContent), 1-based. Default: 1'),
      pageEnd: z
        .number()
        .optional()
        .describe('Last page to read (getContent), inclusive. Default: last'),
      limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .describe(
          'Max documents to return for "list" (newest first). Default 25 — use 10 for "the 10 newest".'
        ),
      documentIds: z
        .array(z.string())
        .optional()
        .describe(
          "Restrict a content search to these document ids. Omit to search all of the user's documents."
        )
    }),
    execute: async ({
      action,
      query,
      nameQuery,
      documentId,
      pageStart,
      pageEnd,
      limit,
      documentIds
    }) => {
      // Session client: RLS scopes every query to the signed-in user.
      const supabase = await createServerSupabaseClient();

      if (action === 'list') {
        const { data } = await supabase
          .from('user_documents')
          .select(
            'id, title, ai_title, ai_description, ai_maintopics, ai_keyentities, total_pages'
          )
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit ?? 25);
        return {
          mode: 'list' as const,
          documents: (data ?? []).map(toDocSummary)
        };
      }

      if (action === 'getContent') {
        if (!documentId) {
          return {
            mode: 'content' as const,
            error: 'documentId is required for getContent.'
          };
        }

        const [{ data: doc }, { data: pages }] = await Promise.all([
          supabase
            .from('user_documents')
            .select('id, title, ai_title, total_pages')
            .eq('user_id', userId)
            .eq('id', documentId)
            .maybeSingle(),
          supabase
            .from('user_documents_vec')
            .select('page_number, text_content')
            .eq('document_id', documentId)
            .gte('page_number', pageStart ?? 1)
            .lte('page_number', pageEnd ?? 100000)
            .order('page_number', { ascending: true })
        ]);

        if (!doc) {
          return {
            mode: 'content' as const,
            error: `No document found with id "${documentId}". Use action "list" to see available documents.`
          };
        }

        // Cap the total payload; report truncation so the model can fetch
        // the remaining pages with a pageStart/pageEnd follow-up call.
        const included: { page: number; text: string }[] = [];
        let totalChars = 0;
        let truncatedAtPage: number | null = null;
        for (const page of pages ?? []) {
          const text = page.text_content ?? '';
          if (totalChars + text.length > MAX_CONTENT_CHARS) {
            if (included.length === 0) {
              // A single page can exceed the cap on its own — include what
              // fits rather than returning nothing (which would send the
              // model into a retry loop against the same page).
              included.push({
                page: page.page_number,
                text: text.slice(0, MAX_CONTENT_CHARS)
              });
              truncatedAtPage = page.page_number + 1;
            } else {
              truncatedAtPage = page.page_number;
            }
            break;
          }
          totalChars += text.length;
          included.push({ page: page.page_number, text });
        }

        return {
          mode: 'content' as const,
          document: toDocSummary({
            id: doc.id,
            title: doc.title,
            ai_title: doc.ai_title,
            ai_description: null,
            ai_maintopics: null,
            ai_keyentities: null,
            total_pages: doc.total_pages
          }),
          pageStart: included[0]?.page ?? null,
          pageEnd: included[included.length - 1]?.page ?? null,
          pages: included,
          ...(truncatedAtPage
            ? {
                truncated: true,
                note: `Output capped at ~${MAX_CONTENT_CHARS} characters. To read further, call getContent again with pageStart: ${truncatedAtPage}.`
              }
            : {})
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
        documentId: m.document_id,
        title: m.ai_title || m.title,
        fileName: m.title,
        page: m.page_number,
        totalPages: m.total_pages,
        text: m.text_content
      }));

      return { mode: 'search' as const, query: q, results };
    }
  });
