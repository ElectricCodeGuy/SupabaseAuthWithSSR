import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { CoreMessage, Message } from 'ai';
import { streamText } from 'ai';
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
  if (!chatSessionId) {
    return new NextResponse('Chat session ID is empty.', {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  const fullMessages: CoreMessage[] = [
    {
      role: 'system',
      content: `
    - You are a helpful assistant that always provides clear and accurate answers! For helpful information use Markdown. Use remark-math formatting for Math Equations
    `
    },
    ...messages.map((message) => ({
      role: message.role as 'user' | 'assistant' | 'system',
      content: message.content
    }))
  ];

  try {
    const result = streamText({
      model: perplexity('sonar-pro'),
      messages: fullMessages,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'perplexity',
        metadata: {
          userId: session.id,
          chatId: chatSessionId
        },
        recordInputs: true,
        recordOutputs: true
      },
      onFinish: async (event) => {
        // Access the experimental provider metadata
        const sources = event.sources;
        console.log('Sources:', sources);
        await saveChatToSupbabase(
          chatSessionId,
          session.id,
          messages[messages.length - 1].content,
          event.text,
          event.sources
        );
      }
    });

    // Return the streaming response
    return result.toDataStreamResponse({ sendSources: true });
  } catch (error) {
    console.error('Error processing Perplexity response:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
