import { type NextRequest, NextResponse } from 'next/server';
import type { Message } from 'ai';
import { streamText, convertToCoreMessages } from 'ai';
import { saveChatToSupbabase } from './SaveToDb';
import { Ratelimit } from '@upstash/ratelimit';
import { openai } from '@ai-sdk/openai';
import type { AnthropicProviderOptions } from '@ai-sdk/anthropic';
import { anthropic } from '@ai-sdk/anthropic';
import { redis } from '@/lib/server/server';
import { getSession } from '@/lib/server/supabase';
import { searchUserDocument } from './tools/documentChat';

export const dynamic = 'force-dynamic';

export const maxDuration = 60;

const getSystemPrompt = (selectedFiles: string[]) => {
  const basePrompt = `You are a helpful assistant. Answer all questions to the best of your ability. Use markdown for formatting your responses to improve readability.`;

  if (selectedFiles.length > 0) {
    return `${basePrompt}

IMPORTANT: The user has uploaded ${
      selectedFiles.length
    } document(s): ${selectedFiles.join(', ')}. 

When answering questions that might be addressed in these documents:
1. ALWAYS use the searchUserDocument tool to retrieve relevant information from the uploaded documents
2. Reference the documents properly in your response with the exact format: [Document title, p.X](<?pdf=Document_title&p=X>)
3. Include direct quotes from the documents when appropriate
4. When information from the documents contradicts your general knowledge, prioritize the document content

For questions not related to the uploaded documents, you can respond based on your general knowledge.`;
  }

  return basePrompt;
};

const getModel = (selectedModel: string) => {
  if (selectedModel === 'sonnet-3-7') {
    return anthropic('claude-3-7-sonnet-20250219');
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
  const messages: Message[] = body.messages ?? [];
  const chatSessionId = body.chatId;
  const signal = body.signal;
  const selectedFiles: string[] = body.selectedBlobs ?? [];

  if (!chatSessionId) {
    return new NextResponse('Chat session ID is empty.', {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  const selectedModel = body.option ?? 'gpt-3.5-turbo-1106';
  const userId = session.id;
  try {
    const model = getModel(selectedModel);
    const SYSTEM_PROMPT = getSystemPrompt(selectedFiles);
    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      messages: convertToCoreMessages(messages),
      abortSignal: signal,
      providerOptions: {
        anthropic: {
          thinking: { type: 'enabled', budgetTokens: 12000 }
        } satisfies AnthropicProviderOptions
      },
      tools: {
        searchUserDocument: searchUserDocument({ userId, selectedFiles })
      },
      maxSteps: 3,
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
            typeof lastMessage.content === 'string' ? lastMessage.content : '';
          await saveChatToSupbabase(
            chatSessionId,
            session.id,
            lastMessageContent,
            event.text,
            event.reasoning
          );
          console.log('Chat saved to Supabase:', chatSessionId);
        } catch (error) {
          console.error('Error saving chat to Redis:', error);
        }
      }
    });

    return result.toDataStreamResponse({
      sendReasoning: true
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
