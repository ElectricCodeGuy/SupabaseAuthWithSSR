import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { UIMessage, FileUIPart } from 'ai'; // Changed from Message
import { streamText, convertToModelMessages } from 'ai'; // Changed from convertToCoreMessages
import { saveChatToSupbabase } from './SaveToDb';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { getSession } from '@/lib/server/supabase';
import { perplexity } from '@ai-sdk/perplexity';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function errorHandler(error: unknown) {
  if (error == null) {
    return 'unknown error';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return JSON.stringify(error);
}

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
    `ratelimit_${session.sub}`
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
  const messages: UIMessage[] = body.messages ?? []; // Changed from Message[]
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

  let fileAttachments: FileUIPart[] = [];

  // Check if the last message is from the user and contains file parts
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === 'user' && lastMessage?.parts) {
    // Extract file parts from the message parts array
    fileAttachments = lastMessage.parts
      .filter((part) => part.type === 'file')
      .map((part) => ({
        name: part.filename || 'file',
        url: part.url,
        type: part.type,
        mediaType: part.mediaType
      }));
  }

  const systemPromptTemplate = `
    - You are a helpful assistant that always provides clear and accurate answers!
    For helpful information use Markdown. Use remark-math formatting for Math Equations`;

  try {
    const result = streamText({
      model: perplexity('sonar-pro'),
      system: systemPromptTemplate,
      messages: convertToModelMessages(messages), // Changed from convertToCoreMessages
      abortSignal: signal,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'perplexity',
        metadata: {
          userId: session.sub,
          chatId: chatSessionId
        },
        recordInputs: true,
        recordOutputs: true
      },
      onFinish: async (event) => {
        const { text, reasoningText, sources } = event; // Changed to include reasoningText

        // Extract text content from the last message parts
        const lastMessageContent =
          lastMessage?.parts
            ?.filter((part) => part.type === 'text')
            ?.map((part) => part.text)
            ?.join('') || '';

        console.log('Sources:', sources);

        await saveChatToSupbabase(
          chatSessionId,
          session.sub, // Use session.sub for user ID like the other route
          lastMessageContent, // Use extracted text content
          text,
          fileAttachments,
          reasoningText, // Pass reasoning text if available
          sources,
          [] // No tool results for Perplexity
        );

        console.log('Chat saved to Supabase:', chatSessionId);
      },
      onError: async (error) => {
        console.error('Error processing Perplexity response:', error);
      }
    });

    result.consumeStream();

    // Return the streaming response with v5 method
    return result.toUIMessageStreamResponse({
      // Changed from toDataStreamResponse
      sendSources: true,
      onError: errorHandler
    });
  } catch (error) {
    console.error('Error processing Perplexity response:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
