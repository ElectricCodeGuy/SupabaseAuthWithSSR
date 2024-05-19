import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse, type Message } from 'ai';
import { saveChatToRedis } from './redis';
import { v4 as uuidv4 } from 'uuid';
import { authenticateAndInitialize } from './AuthAndInit';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { revalidateTag } from 'next/cache';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const perplexity = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY || '',
  baseURL: 'https://api.perplexity.ai/'
});

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const revalidate = true;

export async function POST(req: NextRequest) {
  const authAndInitResult = await authenticateAndInitialize(req);
  const userId = authAndInitResult.userid.session.id;

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '10s')
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
  const messages: Message[] = body.messages ?? [];
  const chatSessionId =
    body.chatId && body.chatId.trim() !== '' ? body.chatId : uuidv4();
  const isNewChat = !body.chatId || body.chatId.trim() === '';

  const fullMessages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `
    - You are a helpful assistant that always provides clear and accurate answers! For helpful information use Markdown. Use remark-math formatting for Math Equations\n
    - References: Reference official documentation and trusted sources where applicable. Link to sources using Markdown.
    `.trim()
    },
    ...messages.map((message) => ({
      role: message.role as 'user' | 'assistant' | 'system',
      content: message.content
    }))
  ];

  try {
    const response = await perplexity.chat.completions.create({
      model: 'pplx-70b-online',
      stream: true,
      messages: fullMessages
    });

    // Stream response handling
    const stream = OpenAIStream(response, {
      onFinal: (completion) => {
        saveChatToRedis(
          chatSessionId,
          userId,
          messages[messages.length - 1].content,
          completion
        );
        if (isNewChat) {
          revalidateTag('datafetch');
        }
      }
    });

    // Return the streaming response
    return new StreamingTextResponse(stream, {
      headers: {
        'x-chat-id': chatSessionId
      }
    });
  } catch (error) {
    console.error('Error processing OpenAI response:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
