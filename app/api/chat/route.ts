import { type NextRequest, NextResponse } from 'next/server';
import type { Message, Attachment } from 'ai';
import { streamText, convertToCoreMessages } from 'ai';
import { saveChatToSupbabase } from './SaveToDb';
import { Ratelimit } from '@upstash/ratelimit';
import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { openai } from '@ai-sdk/openai';
import type { AnthropicProviderOptions } from '@ai-sdk/anthropic';
import { anthropic } from '@ai-sdk/anthropic';
import { redis } from '@/lib/server/server';
import { getSession } from '@/lib/server/supabase';
import { searchUserDocument } from './tools/documentChat';
import { websiteSearchTool } from './tools/WebsiteSearchTool';
import { google } from '@ai-sdk/google';
import type { LanguageModelV1ProviderMetadata } from '@ai-sdk/provider';

export const dynamic = 'force-dynamic';

export const maxDuration = 60;

const getSystemPrompt = (selectedFiles: string[]) => {
  const basePrompt = `You are a helpful assistant. Answer all questions to the best of your ability. Use tools when necessary. Strive to only use a tool one time per question.

FORMATTING: Your responses are rendered using react-markdown with the following capabilities:
- GitHub Flavored Markdown (GFM) support through remarkGfm plugin
- Syntax highlighting for code blocks through rehypeHighlight plugin
- All standard markdown formatting`;

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

function errorHandler(error: unknown) {
  if (error == null) {
    return 'unknown error';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return JSON.stringify(error);
}

const getModel = (selectedModel: string) => {
  switch (selectedModel) {
    case 'claude-3.7-sonnet':
      return anthropic('claude-3-7-sonnet-20250219');
    case 'gpt-4.1':
      return openai('gpt-4.1-2025-04-14');
    case 'gpt-4.1-mini':
      return openai('gpt-4.1-mini');
    case 'o3':
      return openai('o3-2025-04-16');
    case 'gemini-2.5-pro':
      return google('gemini-2.5-pro-preview-03-25');
    case 'gemini-2.5-flash':
      return google('gemini-2.5-flash-preview-04-17');
    default:
      console.error('Invalid model selected:', selectedModel);
      return openai('gpt-4.1-2025-04-14');
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

  let fileAttachments: Attachment[] = [];

  // Check if the last message is from the user and contains attachments
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === 'user' && lastMessage?.experimental_attachments) {
    fileAttachments = lastMessage.experimental_attachments;
  }

  const selectedModel = body.option ?? 'gpt-3.5-turbo-1106';
  const userId = session.id;

  const model = getModel(selectedModel);
  const SYSTEM_PROMPT = getSystemPrompt(selectedFiles);

  const providerOptions: LanguageModelV1ProviderMetadata = {};
  if (selectedModel === 'claude-3.7-sonnet') {
    providerOptions.anthropic = {
      thinking: { type: 'enabled', budgetTokens: 12000 }
    } satisfies AnthropicProviderOptions;
  }

  // Only add OpenAI options if o3 model is selected
  if (selectedModel === 'o3') {
    providerOptions.openai = {
      reasoningEffort: 'high'
    } satisfies OpenAIResponsesProviderOptions;
  }

  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    messages: convertToCoreMessages(messages),
    abortSignal: signal,
    providerOptions,
    tools: {
      searchUserDocument: searchUserDocument({ userId, selectedFiles }),
      websiteSearchTool: websiteSearchTool
    },
    experimental_activeTools:
      selectedFiles.length > 0
        ? ['searchUserDocument', 'websiteSearchTool']
        : ['websiteSearchTool'],
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
      const { text, reasoning, steps, sources } = event;
      const lastMessage = messages[messages.length - 1];
      const lastMessageContent =
        typeof lastMessage.content === 'string' ? lastMessage.content : '';

      const foundReasoningStep = event.steps.find((step) => step.reasoning);
      const reasoningText =
        reasoning ||
        (foundReasoningStep?.reasoning
          ? foundReasoningStep.reasoning
          : undefined);

      await saveChatToSupbabase(
        chatSessionId,
        session.id,
        lastMessageContent,
        text,
        fileAttachments,
        reasoningText,
        sources,
        steps.map((step) => step.toolResults).flat()
      );
      console.log('Chat saved to Supabase:', chatSessionId);
    },
    onError: async (error) => {
      console.error('Error processing chat:', error);
    }
  });

  result.consumeStream(); // We consume the stream if the server is discnnected from the client to ensure the onFinish callback is called

  return result.toDataStreamResponse({
    sendReasoning: true,
    sendSources: true,
    getErrorMessage: errorHandler
  });
}
