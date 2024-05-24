import { NextRequest, NextResponse } from 'next/server';
import { StreamingTextResponse, Message, LangChainAdapter } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
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

const getModel = (selectedModel: string) => {
  if (selectedModel === 'claude3-opus') {
    return new ChatAnthropic({
      model: 'claude-3-opus-20240229',
      maxTokens: 4000,
      temperature: 0,
      streaming: true,
      verbose: true
    });
  } else {
    return new ChatOpenAI({
      temperature: 0.8,
      modelName: selectedModel,
      streaming: true,
      verbose: true
    });
  }
};
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
    body.chatId && body.chatId.trim() !== '' && body.chatId !== '1'
      ? body.chatId
      : uuidv4(); // Generate a new chat ID if it's not provided. Also if the chat ID is '1' we generate a new chat ID. see page.tsx for explanation.
  const isNewChat = !body.chatId || body.chatId.trim() === '';
  const selectedModel = body.option ?? 'gpt-3.5-turbo-1106';

  const abortController = new AbortController();
  const signal = abortController.signal;

  let partialCompletion = ''; // If user cancels the chat, or the stream is otherwise canceled we still save what ever that have been generated.

  req.signal.addEventListener('abort', () => {
    saveChatToRedis(
      chatSessionId,
      userId,
      messages[messages.length - 1].content,
      partialCompletion
    );
    abortController.abort();
  });

  try {
    const model = getModel(selectedModel as 'claude3' | 'chatgpt4');

    const stream = await model.stream(
      messages.map((message) =>
        message.role == 'user'
          ? new HumanMessage(message.content)
          : new AIMessage(message.content)
      ),
      { signal }
    );

    const aiStream = LangChainAdapter.toAIStream(stream, {
      onToken: (token: string) => {
        partialCompletion += token;
      },
      onFinal: () => {
        try {
          saveChatToRedis(
            chatSessionId, // Chat ID
            userId, // User ID
            messages[messages.length - 1].content, // Last user message
            partialCompletion // Last user message
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
    console.error('Error occurred:', e); // Log the actual error
    return new NextResponse('En uventet fejl opstod.', {
      status: 500, // 500 Internal Server Error
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
