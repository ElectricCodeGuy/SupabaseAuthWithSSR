# Next.js API Route Handler Example

This TypeScript code is an example of an API route handler in a Next.js application. It demonstrates how to implement chat functionality using the Vercel AI SDK (`@ai-sdk/openai` and `@ai-sdk/anthropic`) for generating responses from language models.

## Removal of LangChain

Initially, the code used LangChain along with the Vercel AI SDK. However, LangChain has been removed from the project for the following reasons:

1. **Simplicity**: Using only the Vercel AI SDK makes the code simpler and more straightforward.
2. **Redundancy**: Both LangChain and the Vercel AI SDK provide similar functionality, leading to potential redundancy.
3. **Consistency**: Focusing solely on the Vercel AI SDK aligns the codebase with the Vercel ecosystem.
4. **Performance**: Using fewer dependencies can potentially improve the application's performance.

The code now utilizes the Vercel AI SDK directly to interact with the language models, such as OpenAI and Anthropic, without the need for LangChain. This simplifies the codebase while still providing the necessary functionality for generating chat responses.

See more at: https://sdk.vercel.ai/docs/introduction

## Code Example with both Langchain and ai sdk from Vercel.

```typescript
// Your TypeScript code here
import { NextRequest, NextResponse } from 'next/server';
import { StreamingTextResponse, Message, LangChainAdapter } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { saveChatToRedis } from './redis';
import { authenticateAndInitialize } from './Auth';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { revalidateTag } from 'next/cache';
import {
  ChatPromptTemplate,
  MessagesPlaceholder
} from '@langchain/core/prompts';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const revalidate = true;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

const SYSTEM_TEMPLATE = `You are a helpful assistant. Answer all questions to the best of your ability.`;

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
      : uuidv4();
  const isNewChat = !body.chatId || body.chatId.trim() === '';
  const selectedModel = body.option ?? 'gpt-3.5-turbo-1106';

  const abortController = new AbortController();
  const signal = abortController.signal;

  let partialCompletion = '';

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

    // https://js.langchain.com/v0.1/docs/use_cases/chatbots/memory_management/
    const runnableWithSummaryMemoryPrompt = ChatPromptTemplate.fromMessages([
      ['system', SYSTEM_TEMPLATE],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}']
    ]);

    const chain = runnableWithSummaryMemoryPrompt.pipe(model.bind({ signal }));

    const stream = await chain.stream({
      chat_history: messages.slice(0, -1),
      input: messages[messages.length - 1].content
    });

    const aiStream = LangChainAdapter.toAIStream(stream, {
      onToken: (token: string) => {
        partialCompletion += token;
      },
      onFinal: () => {
        try {
          saveChatToRedis(
            chatSessionId,
            userId,
            messages[messages.length - 1].content,
            partialCompletion
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
    console.error('Error occurred:', e);
    return new NextResponse('En uventet fejl opstod.', {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
```
