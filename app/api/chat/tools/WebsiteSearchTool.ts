// app/api/chat/tools/WebsiteSearchTool.ts
//
// Web search via the Exa API. The main model already writes a good search
// query as the tool input — no intermediate LLM query-expansion step, so a
// search costs one Exa call and zero extra model tokens.
import { tool } from 'ai';
import { z } from 'zod';

const NUM_RESULTS = 5;
// Per-result caps, enforced server-side by Exa (text.maxCharacters) — the
// full budget is ~5 × (8000 + 1500) chars ≈ 12k tokens.
const TEXT_MAX_CHARS = 8000;
const HIGHLIGHTS_MAX_CHARS = 1500;

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

export const websiteSearchTool = tool({
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
  execute: async ({ query }) => {
    let results: SearchResultURL[] = [];
    try {
      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
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
    } catch (error) {
      console.error('Error fetching from Exa API:', error);
      return {
        instructions:
          'The web search failed. Tell the user the search could not be completed and answer from your own knowledge, clearly marking it as potentially outdated.',
        context: []
      };
    }

    const contextArray = results.map((result) => ({
      type: 'website',
      title: result.title,
      url: result.url,
      // The most relevant excerpts first — read these before the full text.
      highlights: result.highlights,
      content: result.content,
      publishedDate: result.publishedDate
    }));

    const instructions = `Answer the user's question based on the website content above. Each result carries "highlights" — the passages most relevant to the query — read those first; "content" is the (capped) full page text for surrounding context. Guidelines:

1. Cite sources inline as Markdown links right where the information is used, e.g. "According to [Page title](URL), ...". Never collect references at the end.
2. Every claim taken from a source must be attributable to one of the returned pages.
3. Prefer the most recently published source when information conflicts, and mention the publication date when recency matters.
4. If the results don't actually answer the question, say so and suggest a more specific follow-up search instead of guessing.
5. Keep the answer concise and well-structured.`;

    return {
      instructions,
      context: contextArray
    };
  }
});
