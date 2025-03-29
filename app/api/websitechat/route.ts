// app/api/url-chat/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { streamText, convertToCoreMessages } from 'ai';
import type { Message } from 'ai';
import { saveChatToSupbabase } from './SaveToDb';
import { Ratelimit } from '@upstash/ratelimit';
import { getSession } from '@/lib/server/supabase';
import { openai } from '@ai-sdk/openai';
import { redis } from '@/lib/server/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getSession();

  if (!session) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '24h') // 30 msg per 24 hours
  });

  const { success, limit, reset, remaining } = await ratelimit.limit(
    `ratelimit_${session.id}`
  );
  if (!success) {
    return new NextResponse('Rate limit exceeded. Please try again later.', {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(reset * 1000).toISOString()
      }
    });
  }

  const body = await req.json();
  const messages: Message[] = body.messages ?? [];
  const chatSessionId = body.chatId;
  const signal = body.signal;
  if (!chatSessionId) {
    return new NextResponse('Chat session ID is empty.', {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Create system prompt for AI response (Now in English)
  const systemPromptTemplate = `
    <instructions>
    Today's date is: ${new Date().toLocaleDateString('en-US')}.
    
    Based on the content from the discovered web pages, provide a thorough, informative, and detailed answer to the user's question.
    
    IMPORTANT: You MUST reference a source for EVERY piece of information you provide. Do not include information that cannot be verified by the sources.
    
    Follow these guidelines:

    1. Integrate sources directly into your answer as Markdown links:
       Example: According to [Page Title](URL), it's described that...
    
    2. When referring to specific content, include it as inline links:
       As described in [Relevant section or heading](URL), the following applies...
    
    3. Make sure to link to ALL sources you reference as a natural part of the text.
    
    4. Use Markdown formatting to structure your answer:
       - Use ## and ### for headings
       - Use **bold text** for important concepts
       - Create bullet points or numbered lists when appropriate
    
    5. If the information comes from multiple different pages, weave them together into a coherent answer.
    
    Remember: 
    - ALL claims MUST be supported by sources
    - Avoid grouping references at the end - they should be integrated into the text
    - If the sources do not contain an answer to the question, tell the user so
    </instructions>
`;
  // Stream the AI response
  const result = streamText({
    model: openai.responses('gpt-4o'),
    system: systemPromptTemplate,
    messages: convertToCoreMessages(messages),
    abortSignal: signal,
    tools: {
      web_search_preview: openai.tools.webSearchPreview({
        searchContextSize: 'high',
        userLocation: {
          type: 'approximate',
          country: 'DK'
        }
      })
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'api_chat_website',
      metadata: {
        userId: session.id,
        chatId: chatSessionId
      },
      recordInputs: true,
      recordOutputs: true
    },
    onFinish: async (event) => {
      const { text, sources } = event;
      const lastMessage = messages[messages.length - 1];
      const lastMessageContent =
        typeof lastMessage.content === 'string' ? lastMessage.content : '';

      const formattedSources = sources
        // Remove duplicates by keeping only the first occurrence of each unique URL
        .filter(
          (source, index, self) =>
            index === self.findIndex((s) => s.url === source.url)
        )
        // Ensure title is always a string
        .map((result) => ({
          title: result.title || 'Untitled Source', // Provide a fallback title
          url: result.url
        }));

      // Extract just the URLs as a string array
      const sourceUrls = formattedSources.map((source) => source.url);

      // Save chat history if enabled
      await saveChatToSupbabase(
        chatSessionId,
        session.id,
        lastMessageContent,
        text,
        undefined,
        sourceUrls
      );

      // Update token usage
    },
    onError: async (event) => {
      const { error } = event;
      console.error('Error in Website Chat:', error);
    }
  });

  return result.toDataStreamResponse();
}
