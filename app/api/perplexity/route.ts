import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse, type Message } from 'ai';
import { saveChatToRedis } from './redis';
import { v4 as uuidv4 } from 'uuid';
import { authenticateAndInitialize } from './AuthAndInit';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const perplexity = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY || '',
  baseURL: 'https://api.perplexity.ai/'
});

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

export const runtime = 'edge';

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
  const chatHistory = messages
    .slice(0, -1)
    .map((msg) => msg.content)
    .join('\n');
  const currentMessage = messages[messages.length - 1];

  // Ensure the current message has a string content
  if (typeof currentMessage.content !== 'string') {
    throw new Error('Invalid message content format');
  }

  // Concatenate chat history with the current message, clearly marking the current message
  const fullMessageContent = `--- Chat History ---\n${chatHistory}\n\n--- Current Message ---\n${currentMessage.content}`;
  const systemMessageContent = `
  - You are a Helpfull assistant that always provide clear and accurate answers! For Helpfull information use Markdown. Use remark-math formatting for Math Equations\n
  - References: Reference official documentation and trusted sources where applicable. Link to sources using Markdown.
  `.trim();
  const chatId = body.chatId;
  const chatSessionId = chatId || uuidv4();

  try {
    const response = await perplexity.chat.completions.create({
      model: 'pplx-70b-online',
      stream: true,
      messages: [
        { role: 'system', content: systemMessageContent },
        { role: 'user', content: fullMessageContent }
      ]
    });

    // Stream response handling
    const stream = OpenAIStream(response, {
      onFinal: (completion) => {
        saveChatToRedis(
          chatSessionId,
          userId,
          currentMessage.content,
          completion
        );
      }
    });

    // Return the streaming response
    return new StreamingTextResponse(stream, {
      headers: {
        'x-chat-id': chatSessionId,
        'Content-Type': 'text/event-stream'
      }
    });
  } catch (error) {
    console.error('Error processing OpenAI response:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
