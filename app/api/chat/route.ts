import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { saveChatToRedis } from './redis';
import { authenticateAndInitialize } from './Auth';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { revalidateTag } from 'next/cache';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const revalidate = true;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

const SYSTEM_TEMPLATE = `You are a helpful assistant. Answer all questions to the best of your ability. Helpfull answers in markdown`;

const getModel = (selectedModel: string) => {
  if (selectedModel === 'claude3-opus') {
    return anthropic('claude-3-opus-20240229');
  } else {
    return openai(selectedModel);
  }
};

export async function POST(req: NextRequest) {
  const authAndInitResult = await authenticateAndInitialize(req);
  const userId = authAndInitResult.userid.session.id;

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(2, '10s')
  });

  const { success, limit, reset, remaining } = await ratelimit.limit(
    `ratelimit_${userId}`
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
  const messages = body.messages ?? [];
  const chatSessionId =
    body.chatId && body.chatId.trim() !== '' ? body.chatId : uuidv4();
  const isNewChat = !body.chatId || body.chatId.trim() === '';
  const selectedModel = body.option ?? 'gpt-3.5-turbo-1106';

  const abortController = new AbortController();
  const signal = abortController.signal;

  req.signal.addEventListener('abort', () => {
    saveChatToRedis(
      chatSessionId,
      userId,
      messages[messages.length - 1]?.content || '',
      ''
    );
    abortController.abort();
  });

  try {
    const model = getModel(selectedModel);

    const result = await streamText({
      model,
      messages: [
        {
          role: 'system',
          content: SYSTEM_TEMPLATE
        },
        ...messages
      ],
      abortSignal: signal,
      onFinish: (event) => {
        try {
          saveChatToRedis(
            chatSessionId,
            userId,
            messages[messages.length - 1]?.content || '',
            event.text
          );
          console.log('Chat saved to Redis:', chatSessionId);
        } catch (error) {
          console.error('Error saving chat to Redis:', error);
        }
        if (isNewChat) {
          revalidateTag('datafetch');
        }
      }
    });

    return result.toAIStreamResponse({
      headers: {
        'x-chat-id': chatSessionId,
        'x-new-chat': isNewChat ? 'true' : 'false',
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'InvalidToken') {
      return new NextResponse('Autentifikationstokenet fejlede.', {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    console.error('Error occurred:', e);
    return new NextResponse('En uventet fejl opstod.', {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
