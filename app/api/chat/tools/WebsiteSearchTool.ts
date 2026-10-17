// app/api/chat/tools/WebsiteSearchTool.ts
//
// Exa remains the default; WEB_SEARCH_PROVIDER=parallel opts into keyless MCP.
import { tool } from 'ai';
import { createMCPClient } from '@ai-sdk/mcp';
import { z } from 'zod';

const NUM_RESULTS = 5;
// Per-result caps, enforced server-side by Exa (text.maxCharacters) — the
// full budget is ~5 × (8000 + 1500) chars ≈ 12k tokens.
const TEXT_MAX_CHARS = 8000;
const HIGHLIGHTS_MAX_CHARS = 1500;
const PARALLEL_TIMEOUT_MS = 30_000;
const USER_AGENT =
  'SupaChat/5.1.0 (+https://github.com/ElectricCodeGuy/SupabaseAuthWithSSR)';

const parallelResultsSchema = z.object({
  results: z.array(
    z.object({
      url: z.url({ protocol: /^https?$/ }),
      title: z.string().nullish(),
      excerpts: z.array(z.string()),
      publish_date: z.string().nullish()
    })
  )
});

async function searchParallel(
  query: string,
  sessionId: string,
  modelName: string,
  abortSignal?: AbortSignal
): Promise<SearchResultURL[]> {
  const signals = [AbortSignal.timeout(PARALLEL_TIMEOUT_MS)];
  if (abortSignal) signals.push(abortSignal);
  const signal = AbortSignal.any(signals);
  signal.throwIfAborted();
  const client = await createMCPClient({
    clientName: 'supachat',
    version: '5.1.0',
    protocolVersionDiscovery: false,
    initializationOptions: { signal },
    transport: {
      type: 'http',
      url: 'https://search.parallel.ai/mcp',
      headers: { 'User-Agent': USER_AGENT },
      // Bound the whole connection, discovery and search, including body reads.
      fetch: (url, init) =>
        fetch(url, {
          ...init,
          signal: AbortSignal.any(
            init?.signal ? [signal, init.signal] : [signal]
          )
        })
    }
  });
  try {
    const tools = await client.tools();
    if (!tools.web_search)
      throw new Error('Parallel web_search is unavailable');
    const raw = await tools.web_search.execute(
      {
        objective: query,
        search_queries: [query],
        session_id: sessionId,
        model_name: modelName
      },
      {
        toolCallId: 'web-search',
        messages: [],
        context: {},
        abortSignal: signal
      }
    );
    const result = z
      .object({
        isError: z.boolean().optional(),
        structuredContent: z.unknown().optional(),
        content: z.array(
          z.object({ type: z.string(), text: z.string().optional() })
        )
      })
      .parse(raw);
    if (result.isError) throw new Error('Parallel web_search failed');
    const data = parallelResultsSchema.parse(
      result.structuredContent ??
        JSON.parse(
          result.content
            .filter((part) => part.type === 'text')
            .map((part) => part.text ?? '')
            .join('\n')
        )
    );
    return data.results.slice(0, NUM_RESULTS).map((result) => ({
      title: result.title || result.url,
      url: result.url,
      // Parallel returns relevant excerpts, not full-page text.
      content: '',
      highlights: [result.excerpts.join('\n\n').slice(0, TEXT_MAX_CHARS)],
      publishedDate:
        result.publish_date && Number.isFinite(Date.parse(result.publish_date))
          ? result.publish_date
          : undefined
    }));
  } finally {
    await client.close();
  }
}

interface SearchResultURL {
  title: string;
  url: string;
  content: string;
  highlights: string[];
  publishedDate?: string;
}

type ExaSearchResult = {
  id: string;
  title: string;
  url: string;
  publishedDate?: string;
  author?: string;
  text?: string;
  // Embedding-ranked most-relevant excerpts for the query (requested via
  // contents.highlights) + their 0-1 relevance scores.
  highlights?: string[];
  highlightScores?: number[];
};

type ExaAPIResponse = {
  requestId: string;
  autopromptString?: string;
  resolvedSearchType?: string;
  results: ExaSearchResult[];
};

export const websiteSearchTool = ({
  chatSessionId,
  modelName
}: {
  chatSessionId: string;
  modelName: string;
}) =>
  tool({
    description:
      'Search the web for up-to-date information. Use this for questions about recent events, current prices, versions, news, or any fact that may have changed since your training data. Write a focused, specific search query — you can call the tool multiple times with different queries to cover different angles.',
    inputSchema: z.object({
      query: z
        .string()
        .min(1)
        .describe(
          'The web search query. Be specific and include key terms, names, and a year when recency matters.'
        )
    }),
    execute: async ({ query }, { abortSignal }) => {
      let results: SearchResultURL[] = [];
      const provider = process.env.WEB_SEARCH_PROVIDER || 'exa';
      try {
        if (provider === 'parallel') {
          results = await searchParallel(
            query,
            chatSessionId,
            modelName,
            abortSignal
          );
        } else if (provider === 'exa') {
          const response = await fetch('https://api.exa.ai/search', {
            method: 'POST',
            signal: abortSignal,
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.EXA_API_KEY || ''
            },
            body: JSON.stringify({
              query,
              type: 'auto',
              numResults: NUM_RESULTS,
              contents: {
                // Capped server-side so huge pages can't blow up the context.
                text: { maxCharacters: TEXT_MAX_CHARS },
                // Highlights: Exa's embedding-ranked most-relevant excerpts for
                // this query — often the answer even when it is buried deep in
                // a long page beyond the text cap.
                highlights: { query, maxCharacters: HIGHLIGHTS_MAX_CHARS }
              }
            })
          });

          if (!response.ok) {
            throw new Error(
              `Exa API error: ${response.status} ${response.statusText}`
            );
          }

          const data: ExaAPIResponse = await response.json();
          results = data.results.map((result) => ({
            title: result.title,
            url: result.url,
            content: result.text || '',
            highlights: result.highlights ?? [],
            publishedDate: result.publishedDate
          }));
        } else {
          throw new Error('WEB_SEARCH_PROVIDER must be exa or parallel');
        }
      } catch (error) {
        abortSignal?.throwIfAborted();
        console.error(`Error fetching from ${provider}:`, error);
        return {
          instructions:
            'The web search failed. Tell the user the search could not be completed and answer from your own knowledge, clearly marking it as potentially outdated.',
          context: []
        };
      }

      const instructions = `Answer the user's question based on the website content above. Each result carries "highlights" — the passages most relevant to the query — read those first; "content", when available, is the (capped) full page text for surrounding context. Guidelines:

1. Cite sources inline as Markdown links right where the information is used, e.g. "According to [Page title](URL), ...". Never collect references at the end.
2. Every claim taken from a source must be attributable to one of the returned pages.
3. Prefer the most recently published source when information conflicts, and mention the publication date when recency matters.
4. If the results don't actually answer the question, say so and suggest a more specific follow-up search instead of guessing.
5. Keep the answer concise and well-structured.`;

      return {
        instructions,
        context: results.map((result) => ({
          type: 'website',
          title: result.title,
          url: result.url,
          // The most relevant excerpts first — read these before the full text.
          highlights: result.highlights,
          content: result.content,
          publishedDate: result.publishedDate
        }))
      };
    }
  });
