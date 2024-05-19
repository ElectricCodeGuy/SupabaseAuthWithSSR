import { NextRequest, NextResponse } from 'next/server';
import { StreamingTextResponse, Message, LangChainAdapter } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { ChatOpenAI } from '@langchain/openai';
import { saveChatToRedis } from './redis';
import { authenticateAndInitialize } from './Auth';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const revalidate = true;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

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
  const option = body.option ?? 'gpt-3.5-turbo-1106';

  const model = new ChatOpenAI({
    temperature: 0.8,
    modelName: option,
    streaming: true,
    verbose: true
  });

  const stream = await model.stream(
    messages.map((message) =>
      message.role == 'user'
        ? new HumanMessage(message.content)
        : new AIMessage(message.content)
    )
  );

  const aiStream = LangChainAdapter.toAIStream(stream, {
    onStart: () => console.log('Stream started'),
    onFinal: (completion) => {
      try {
        saveChatToRedis(
          chatSessionId, // Chat ID
          userId, // User ID
          messages[messages.length - 1].content, // Last user message
          completion // Last AI completion
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

  return new StreamingTextResponse(aiStream, {
    headers: {
      'x-chat-id': chatSessionId
    }
  });
}
