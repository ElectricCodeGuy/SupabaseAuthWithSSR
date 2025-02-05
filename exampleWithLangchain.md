# Next.js API Route Handler Example

Next.js API Route Handler - Why We Ditched LangChain
This TypeScript code demonstrates a clean Next.js API route handler using the Vercel AI SDK. We've completely removed LangChain, and here's why you should too:
Why LangChain Is a Liability

Bloated Abstractions: LangChain adds unnecessary layers of complexity that make debugging a nightmare. What could be a simple API call becomes a maze of abstractions.
Performance Overhead: LangChain's "chains" and "agents" add significant processing overhead for simple operations that can be done with a few lines of native code.
Version Instability: Breaking changes are frequent, and documentation often lags behind the actual implementation. You'll spend more time fixing broken dependencies than building features.
Poor TypeScript Support: The type definitions are often incomplete or incorrect, leading to frustrating development experiences and potential runtime errors.

Benefits of Using Vercel AI SDK Directly

**Simplicity:** Direct integration with AI models using clear, predictable patterns
**Better Performance:** No bloat or unnecessary abstraction layers
**Superior TypeScript Support:** First-class types and better IDE integration
**Easier Debugging:** Clear stack traces and predictable behavior
**Smaller Bundle Size:** No massive dependency tree to manage

The code example shows how to handle streaming responses, rate limiting, and error handling without LangChain's overcomplicated abstractions. See the Vercel AI SDK docs at: https://sdk.vercel.ai/docs/introduction

**Remember:** Just because a tool is popular doesn't mean it's the right choice. LangChain tries to solve problems that don't exist while creating new ones. Stick with direct, purpose-built tools like the Vercel AI SDK for cleaner, more maintainable code.

## Code Example with both Langchain and ai sdk from Vercel.

```typescript
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
