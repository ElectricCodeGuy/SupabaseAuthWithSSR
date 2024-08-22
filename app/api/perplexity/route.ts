import { NextRequest, NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, CoreMessage, Message } from 'ai';
import { saveChatToRedis } from './redis';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { revalidateTag } from 'next/cache';
import { getSession } from '@/lib/server/supabase';

const perplexity = createOpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY ?? '',
  baseURL: 'https://api.perplexity.ai/'
});

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Updated to 30 seconds
export const revalidate = true;

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
    limiter: Ratelimit.slidingWindow(30, '10s')
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
  const chatSessionId =
    body.chatId && body.chatId.trim() !== '' ? body.chatId : uuidv4();
  const isNewChat = !body.chatId || body.chatId.trim() === '';

  const fullMessages: CoreMessage[] = [
    {
      role: 'system',
      content: `
    - You are a helpful assistant that always provides clear and accurate answers! For helpful information use Markdown. Use remark-math formatting for Math Equations
    - References: Reference official documentation and trusted sources where applicable. Link to sources using Markdown.
    `
    },
    ...messages.map((message) => ({
      role: message.role as 'user' | 'assistant' | 'system',
      content: message.content
    }))
  ];

  try {
    const result = await streamText({
      model: perplexity('llama-3-sonar-large-32k-online'),
      messages: fullMessages,
      onFinish: async (event) => {
        await saveChatToRedis(
          chatSessionId,
          session.id,
          messages[messages.length - 1].content,
          event.text,
          isNewChat
        );
        if (isNewChat) {
          revalidateTag('datafetch');
        }
      }
    });

    // Return the streaming response
    return result.toAIStreamResponse({
      headers: {
        'x-chat-id': chatSessionId
      }
    });
  } catch (error) {
    console.error('Error processing Perplexity response:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
