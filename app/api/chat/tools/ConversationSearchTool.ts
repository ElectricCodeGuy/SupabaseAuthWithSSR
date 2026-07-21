// Search the user's past chat conversations by keyword. Uses the existing
// chat_sessions + message_parts tables through the RLS-scoped session client —
// no extra infrastructure and no service-role key needed.
import 'server-only';
import { tool } from 'ai';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/server/server';

interface ConversationSearchProps {
  userId: string;
  // The chat the user is currently in — excluded from results.
  currentChatId: string;
}

// Keywords are interpolated into a PostgREST .or() ilike filter. Strip the
// grammar characters (commas, parens, quotes) and ilike wildcards so a weird
// keyword can never break the filter or scan everything.
function sanitizeKeyword(keyword: string): string {
  return keyword.replace(/[,()"'%_\\]/g, ' ').trim();
}

// Snippet of the message text centered on the first keyword hit.
function extractSnippet(text: string, keywords: string[]): string {
  const lower = text.toLowerCase();
  let hitIndex = -1;
  for (const kw of keywords) {
    const idx = lower.indexOf(kw.toLowerCase());
    if (idx !== -1 && (hitIndex === -1 || idx < hitIndex)) {
      hitIndex = idx;
    }
  }
  const start = Math.max(0, (hitIndex === -1 ? 0 : hitIndex) - 80);
  const snippet = text.slice(start, start + 240).trim();
  return `${start > 0 ? '…' : ''}${snippet}${start + 240 < text.length ? '…' : ''}`;
}

export const conversationSearch = ({
  userId,
  currentChatId
}: ConversationSearchProps) =>
  tool({
    description: `Search the user's PAST chat conversations. Use this when the user references something they discussed before ("what did we say about...", "find the chat where..."), or when earlier context would clearly help.

Provide 3-8 individual keywords in the user's language. Use base word forms (e.g. "deploy" instead of "deploying") — each keyword is matched as a substring, so shorter stems match more. Include synonyms.

Returns matching conversations with title, date, a link, and text snippets around the matches. Include the links in your answer so the user can open the conversations.`,
    inputSchema: z.object({
      keywords: z
        .array(z.string().min(2))
        .min(1)
        .max(8)
        .describe(
          'Individual search keywords (single words or short 2-word terms), base forms preferred'
        ),
      maxResults: z
        .number()
        .min(1)
        .max(10)
        .optional()
        .describe('Max conversations to return (default 5)')
    }),
    execute: async ({ keywords, maxResults }) => {
      const supabase = await createServerSupabaseClient();
      const limit = maxResults ?? 5;

      const cleaned = [
        ...new Set(keywords.map(sanitizeKeyword).filter((k) => k.length >= 2))
      ];
      if (cleaned.length === 0) {
        return {
          success: false as const,
          results: [],
          totalFound: 0,
          message: 'No usable keywords provided.'
        };
      }

      // Search message text and chat titles in parallel. RLS already limits
      // both queries to the signed-in user's own rows.
      const [contentResults, titleResults] = await Promise.all([
        supabase
          .from('message_parts')
          .select(
            'chat_session_id, text_text, role, created_at, chat_sessions!inner(id, user_id, chat_title, created_at, updated_at)'
          )
          .eq('type', 'text')
          .eq('chat_sessions.user_id', userId)
          .neq('chat_session_id', currentChatId)
          .not('text_text', 'is', null)
          .or(cleaned.map((kw) => `text_text.ilike.%${kw}%`).join(','))
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('chat_sessions')
          .select('id, chat_title, created_at, updated_at')
          .eq('user_id', userId)
          .neq('id', currentChatId)
          .not('chat_title', 'is', null)
          .or(cleaned.map((kw) => `chat_title.ilike.%${kw}%`).join(','))
          .order('updated_at', { ascending: false })
          .limit(50)
      ]);

      if (contentResults.error) {
        console.error('conversationSearch content error:', contentResults.error);
      }
      if (titleResults.error) {
        console.error('conversationSearch title error:', titleResults.error);
      }

      type SessionHit = {
        title: string | null;
        date: string;
        snippets: string[];
        matchCount: number;
      };
      const hits = new Map<string, SessionHit>();

      for (const part of contentResults.data ?? []) {
        const session = part.chat_sessions;
        const existing = hits.get(part.chat_session_id);
        if (existing) {
          existing.matchCount++;
          if (existing.snippets.length < 3 && part.text_text) {
            existing.snippets.push(extractSnippet(part.text_text, cleaned));
          }
        } else {
          hits.set(part.chat_session_id, {
            title: session.chat_title,
            date: session.updated_at || session.created_at,
            snippets: part.text_text
              ? [extractSnippet(part.text_text, cleaned)]
              : [],
            matchCount: 1
          });
        }
      }

      for (const session of titleResults.data ?? []) {
        if (!hits.has(session.id)) {
          hits.set(session.id, {
            title: session.chat_title,
            date: session.updated_at || session.created_at,
            snippets: [],
            matchCount: 1
          });
        }
      }

      if (hits.size === 0) {
        return {
          success: true as const,
          results: [],
          totalFound: 0,
          message: `No past conversations matched: ${cleaned.join(', ')}.`
        };
      }

      // Rank by match count, then recency.
      const ranked = [...hits.entries()]
        .sort(
          ([, a], [, b]) =>
            b.matchCount - a.matchCount ||
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        .slice(0, limit);

      const results = ranked.map(([sessionId, hit]) => ({
        conversationId: sessionId,
        title: hit.title || 'Untitled chat',
        date: hit.date,
        link: `/chat/${sessionId}`,
        matchCount: hit.matchCount,
        snippets: hit.snippets
      }));

      return {
        success: true as const,
        results,
        totalFound: hits.size,
        message: `Found ${hits.size} conversation(s); returning the ${results.length} best match(es).`
      };
    }
  });
