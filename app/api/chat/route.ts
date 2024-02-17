import { NextRequest, NextResponse } from 'next/server';
import { StreamingTextResponse, Message, LangChainStream } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { ChatOpenAI } from '@langchain/openai';
import { saveChatToRedis } from './redis';
import { authenticateAndInitialize } from './Auth';

import {
  GeneralChatMessagePrompt,
  TechnicalSupportChatMessagePrompt,
  TravelAdviceChatMessagePrompt
} from './prompt';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

export const runtime = 'edge';

const formatMessage = (message: Message) => {
  return `${message.role}: ${message.content}`;
};
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
  const option = body.option ?? 'gpt-3.5-turbo-1106';
  const promptType = body.prompt ?? 'general';

  // Select the appropriate ChatMessagePrompt based on the provided prompt type
  let ChatMessagePrompt;
  switch (promptType) {
    case 'technical':
      ChatMessagePrompt = TechnicalSupportChatMessagePrompt;
      break;
    case 'travel':
      ChatMessagePrompt = TravelAdviceChatMessagePrompt;
      break;
    default:
      ChatMessagePrompt = GeneralChatMessagePrompt;
  }

  // Rest of the function remains unchanged, except where you use ChatMessagePrompt...
  const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
  const currentMessageContent = messages[messages.length - 1].content;

  const model = new ChatOpenAI({
    temperature: 0.8,
    modelName: option,
    streaming: true,
    verbose: true
  });

  const { stream, handlers } = LangChainStream({
    onStart: () => console.log('Stream started'),
    onFinal: (completion) => {
      try {
        saveChatToRedis(
          chatSessionId,
          userId,
          currentMessageContent,
          completion
        );
        console.log('Chat saved to Redis:', chatSessionId);
      } catch (error) {
        console.error('Error saving chat to Redis:', error);
      }
    }
  });

  const chain = ChatMessagePrompt.pipe(model).pipe(new StringOutputParser());

  chain.invoke(
    {
      chat_history: formattedPreviousMessages.join('\n'),
      question: currentMessageContent
    },
    { callbacks: [handlers] }
  );

  return new StreamingTextResponse(stream, {
    headers: {
      'x-chat-id': chatSessionId,
      'Content-Type': 'text/event-stream; charset=utf-8'
    }
  });
}
