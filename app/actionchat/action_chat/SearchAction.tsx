import React from 'react';
import {
  getMutableAIState,
  createStreamableUI,
  createStreamableValue
} from 'ai/rsc';
import { streamText, generateId, generateObject } from 'ai';
import { Card, CardContent } from '@/components/ui/card';
import { Search, RefreshCw, Loader2 } from 'lucide-react';
import {
  BotMessage,
  InternetSearchToolResults
} from '../component/ChatWrapper';
import { v4 as uuidv4 } from 'uuid';
import { openai } from '@ai-sdk/openai';
import { getUserInfo } from '@/lib/server/supabase';
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/server/server';
import { load } from 'cheerio';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import { z } from 'zod';
import {
  type SubmitMessageResult,
  getModel,
  saveChatToSupbabase,
  type AI
} from './shared';

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  raw_content: string;
  score: number;
}

interface TavilyAPIResponse {
  answer: string;
  query: string;
  response_time: string;
  follow_up_questions: string[];
  images: string[];
  results: TavilySearchResult[];
}

// Type for our processed search result
interface ProcessedSearchResult {
  title: string;
  url: string;
  content: string;
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

export async function SearchTool(
  currentUserMessage: string,
  model_select: 'claude3' | 'chatgpt4',
  chatId: string
): Promise<SubmitMessageResult> {
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
  const aiState = getMutableAIState<AI>();
  aiState.update([
    ...aiState.get(),
    {
      role: 'user',
      content: currentUserMessage
    }
  ]);

  // Create initial UI for search process
  const stream = createStreamableUI(
    <div className="flex justify-center items-center mb-2 p-2 rounded-xl bg-gray-100 bg-gradient-to-r from-[#e0eaFC] to-[#cfdef3] shadow-md transition-colors hover:bg-gray-200">
      <p className="text-gray-600 italic">
        Searching for relevant information...
      </p>
      <Loader2 className="animate-spin" />
    </div>
  );
  let searchResults: ProcessedSearchResult[] = [];

  const nhm = new NodeHtmlMarkdown();
  const dataStream = createStreamableValue();
  (async () => {
    // Prompt to generate search query variations
    const contextualizeQSystemPrompt = `
    As an expert in information retrieval, reformulate the user's query to optimize search results. Include the user's original question.
  
    The goal is to produce reformulated questions that capture the essence of the query and generate optimized search terms.
  
    Also generate variations of the query to improve search results and find the most up-to-date information. The variations should focus on:
    1. Precisely identifying the main topic or key concept.
    2. Focusing on the relevant context or domain.
    3. Exploring potential applications or implications of the topic.
  
    All questions and variations should be in the same language as the users question.
  
    Original question: ${currentUserMessage}
  `;

    // Generate search query variations using AI
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: contextualizeQSystemPrompt,
      schema: zodSchemaSearch,
      mode: 'json',
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'improve_web',
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

    // Filter out empty queries
    const searchQueries = [
      object.variation1,
      object.variation2,
      object.variation3
    ].filter((query) => query !== undefined && query.trim() !== '');
    stream.update(
      <Card className="flex flex-col p-4 rounded-lg bg-gradient-to-br from-[#f5f7fa] to-[#e8edf5] shadow-lg border border-white/40 backdrop-blur-sm transition-all duration-300 hover:translate-y-[-2px] hover:shadow-xl">
        <CardContent className="p-0">
          <div className="flex items-center gap-2 mb-3">
            <h6 className="text-primary-dark font-semibold text-lg">
              Optimized Search Variations
            </h6>
          </div>
          <div className="w-full bg-white rounded mt-2 overflow-hidden">
            {searchQueries.map((query, index) => (
              <div
                key={index}
                className={`flex items-center py-1.5 px-2 transition-colors hover:bg-gray-50 ${
                  index !== searchQueries.length - 1
                    ? 'border-b border-gray-100'
                    : ''
                }`}
              >
                <div className="min-w-[40px]">
                  <Search className="h-5 w-5 text-primary" />
                </div>
                <div className="font-medium text-gray-800 text-[0.95rem]">
                  {query}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-3 p-2 rounded bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-1 text-sm text-primary-dark font-medium">
              <RefreshCw className="h-4 w-4" />
              Processing results for comprehensive analysis
            </div>
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        </CardContent>
      </Card>
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
                return {
                  title: result.title,
                  url: result.url,
                  content: result.content
                };
              }

              const contentHtml = await contentResponse.text();
              const $ = load(contentHtml);

              // First get the full body content with basic cleaning
              const bodyContent = $('body')
                .clone()
                .find('script, style, nav, header, footer, iframe, noscript')
                .remove()
                .end();

              // Then try to identify main content area within the body
              const mainSelectors = [
                'article',
                'main',
                '.main-content',
                '#main-content',
                '.post-content',
                '.article-content',
                '.entry-content',
                '.content'
              ];

              let mainContent = null;
              for (const selector of mainSelectors) {
                const found = bodyContent.find(selector);
                if (found.length) {
                  console.log('Found main content:', selector);
                  mainContent = found;
                  break;
                }
              }

              // Use main content if found, otherwise use cleaned body
              const contentRAW = mainContent
                ? mainContent.html()
                : bodyContent
                    .find(
                      'button, .button, [role="button"], .menu, .navigation, .cookie-notice, .popup, .modal, .banner, .advertisement, .newsletter, .widget'
                    )
                    .remove()
                    .end()
                    .html();

              // Convert to markdown with proper sanitization
              const content = nhm.translate(contentRAW ?? '');

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
      .reduce<ProcessedSearchResult[]>((acc, result) => {
        if (!acc.some((r: ProcessedSearchResult) => r.url === result.url)) {
          acc.push(result);
        }
        return acc;
      }, []);

    searchResults = uniqueSearchResults;

    // Update UI with search results and preparation message
    stream.update(
      <>
        <div className="flex justify-center items-center my-2 p-2 rounded-xl bg-gray-100 bg-gradient-to-r from-[#e0eaFC] to-[#cfdef3] shadow-md transition-colors hover:bg-gray-200">
          <p className="text-gray-600 italic">Preparing response...</p>
          <Loader2 className="animate-spin" />
        </div>
        <InternetSearchToolResults
          searchResults={searchResults.map((result) => ({
            title: result.title,
            url: result.url
          }))}
        />
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
        functionId: 'chat_to_web',
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

        aiState.done([...aiState.get(), { role: 'assistant', content: text }]);
      }
    });

    let isFirstChunk = true;
    for await (const textDelta of textStream) {
      if (isFirstChunk) {
        // Initialize the UI stream with the first chunk
        stream.update(
          <>
            <BotMessage textStream={dataStream.value} />
            <InternetSearchToolResults
              searchResults={searchResults.map((result) => ({
                title: result.title,
                url: result.url
              }))}
            />
          </>
        );
        isFirstChunk = false;
      }

      dataStream.append(textDelta);
    }
    // We update here to prevent the UI from flickering
    stream.update(
      <>
        <BotMessage textStream={dataStream.value} />
        <InternetSearchToolResults
          searchResults={searchResults.map((result) => ({
            title: result.title,
            url: result.url
          }))}
        />
      </>
    );
    dataStream.done();
    status.done('done');
    stream.done();
  })().catch((e) => {
    console.error('Error in chat handler:', e);
    stream.error(
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
    display: stream.value,
    chatId: CurrentChatSessionId,
    status: status.value
  };
}
