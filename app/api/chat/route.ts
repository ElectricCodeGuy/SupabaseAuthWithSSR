import { type NextRequest, NextResponse } from 'next/server';
import { streamText, CoreMessage } from 'ai';
import { saveChatToSupbabase } from './SaveToDb';
import { Ratelimit } from '@upstash/ratelimit';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { redis } from '@/lib/server/server';
import { getSession } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

export const maxDuration = 60;

const SYSTEM_TEMPLATE = `You are a helpful assistant. Answer all questions to the best of your ability. Helpfull answers in markdown`;

const getModel = (selectedModel: string) => {
  if (selectedModel === 'sonnet-3-5') {
    return anthropic('claude-3-5-sonnet-20241022');
  } else {
    return openai(selectedModel);
  }
};

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
  const messages: CoreMessage[] = body.messages ?? [];
  const chatSessionId = body.chatId;
  if (!chatSessionId) {
    return new NextResponse('Chat session ID is empty.', {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  const selectedModel = body.option ?? 'gpt-3.5-turbo-1106';

  const abortController = new AbortController();
  const signal = abortController.signal;

  try {
    const model = getModel(selectedModel);

    const result = streamText({
      model,
      system: SYSTEM_TEMPLATE,
      messages: messages,
      abortSignal: signal,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'api_chat',
        metadata: {
          userId: session.id,
          chatId: chatSessionId
        },
        recordInputs: true,
        recordOutputs: true
      },
      onFinish: async (event) => {
        try {
          const lastMessage = messages[messages.length - 1];
          const lastMessageContent =
            typeof lastMessage?.content === 'string' ? lastMessage.content : '';
          await saveChatToSupbabase(
            chatSessionId,
            session.id,
            lastMessageContent,
            event.text
          );
          console.log('Chat saved to Supabase:', chatSessionId);
        } catch (error) {
          console.error('Error saving chat to Redis:', error);
        }
      }
    });

    return result.toDataStreamResponse();
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
