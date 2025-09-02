import { type NextRequest, NextResponse } from 'next/server';
import type { UIMessage } from 'ai'; // Changed from Message
import { streamText, convertToModelMessages } from 'ai'; // Changed from convertToCoreMessages
import { saveMessagesToDB } from './SaveToDbIncremental';
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
import type { GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';
import { stepCountIs } from 'ai'; // Import for stopWhen
import type { SharedV2ProviderMetadata } from '@ai-sdk/provider';

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
    case 'claude-4-sonnet':
      return anthropic('claude-4-sonnet-20250514');
    case 'gpt-5':
      return openai('gpt-5');
    case 'gpt-5-mini':
      return openai('gpt-5-mini');
    case 'o3':
      return openai('o3-2025-04-16');
    case 'gemini-2.5-pro':
      return google('gemini-2.5-pro');
    case 'gemini-2.5-flash':
      return google('gemini-2.5-flash');
    default:
      console.error('Invalid model selected:', selectedModel);
      return openai('gpt-5');
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
    limiter: Ratelimit.slidingWindow(30, '24h')
  });

  const { success, limit, reset, remaining } = await ratelimit.limit(
    `ratelimit_${session.sub}`
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
  const messages: UIMessage[] = body.messages ?? []; // Changed from Message[]
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
  const userId = session.sub;

  const providerOptions: SharedV2ProviderMetadata = {};
  if (selectedModel === 'claude-3.7-sonnet') {
    providerOptions.anthropic = {
      thinking: { type: 'enabled', budgetTokens: 12000 }
    } satisfies AnthropicProviderOptions;
  }

  if (
    selectedModel === 'gemini-2.5-pro' ||
    selectedModel === 'gemini-2.5-flash'
  ) {
    providerOptions.google = {
      thinkingConfig: {
        thinkingBudget: 2048,
        includeThoughts: true
      }
    } satisfies GoogleGenerativeAIProviderOptions;
  }

  // Only add OpenAI options if o3 model is selected
  if (selectedModel === 'o3') {
    providerOptions.openai = {
      reasoningEffort: 'high'
    } satisfies OpenAIResponsesProviderOptions;
  }

  if (selectedModel === 'gpt-5' || selectedModel === 'gpt-5-mini') {
    providerOptions.openai = {
      reasoningEffort: 'low',
      reasoningSummary: 'auto',
      textVerbosity: 'medium'
    } satisfies OpenAIResponsesProviderOptions;
  }
  // Track step count and assistant message ID for incremental saves
  let stepCount = 0;
  let userMessageSaved = false;
  const assistantMessageId = crypto.randomUUID();

  const result = streamText({
    model: getModel(selectedModel),
    system: getSystemPrompt(selectedFiles),
    messages: convertToModelMessages(messages), // Changed from convertToCoreMessages
    abortSignal: signal,
    providerOptions, // Changed from providerMetadata
    tools: {
      searchUserDocument: searchUserDocument({
        userId,
        selectedBlobs: selectedFiles
      }),
      websiteSearchTool: websiteSearchTool
    },
    // Changed from experimental_activeTools
    activeTools:
      selectedFiles.length > 0
        ? ['searchUserDocument', 'websiteSearchTool']
        : ['websiteSearchTool'],
    stopWhen: stepCountIs(3), // Changed from maxSteps
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'api_chat',
      metadata: {
        userId: session.sub,
        chatId: chatSessionId
      },
      recordInputs: true,
      recordOutputs: true
    },
    // NEW: Save each step as it completes
    onStepFinish: async (stepResult) => {
      try {
        const messagesToSave: UIMessage[] = [];

        // On the first step, include the user message
        if (stepCount === 0 && !userMessageSaved) {
          const lastMessage = messages[messages.length - 1];
          if (lastMessage) {
            messagesToSave.push(lastMessage);
            userMessageSaved = true;
          }
        }

        // Build UIMessage from the step result content - use same message ID for all steps
        const uiMessage: UIMessage = {
          id: assistantMessageId, // USE THE SAME ID FOR ALL STEPS
          role: 'assistant',
          parts: []
        };

        // Add all content parts from the step
        stepResult.content.forEach((content) => {
          if (content.type === 'text') {
            uiMessage.parts.push({
              type: 'text',
              text: content.text,
              providerMetadata: content.providerMetadata
            });
          } else if (content.type === 'reasoning') {
            uiMessage.parts.push({
              type: 'reasoning',
              text: content.text,
              providerMetadata: content.providerMetadata
            });
          } else if (content.type === 'source') {
            // Handle source parts - can be URL or document
            if ('url' in content && 'title' in content) {
              uiMessage.parts.push({
                type: 'source-url',
                sourceId: content.id,
                url: content.url,
                title: content.title,
                providerMetadata: content.providerMetadata
              });
            } else if ('mediaType' in content && 'filename' in content) {
              uiMessage.parts.push({
                type: 'source-document',
                sourceId: content.id,
                mediaType: content.mediaType,
                title: content.title || '',
                filename: content.filename,
                providerMetadata: content.providerMetadata
              });
            }
          } else if (content.type === 'file') {
            uiMessage.parts.push({
              type: 'file',
              url: content.file.base64
                ? `data:${content.file.mediaType};base64,${content.file.base64}`
                : '',
              mediaType: content.file.mediaType,
              filename: undefined, // GeneratedFile doesn't have filename
              providerMetadata: content.providerMetadata
            });
          } else if (content.type === 'tool-result') {
            uiMessage.parts.push({
              type: `tool-${content.toolName}`,
              toolCallId: content.toolCallId,
              state: 'output-available',
              input: content.input,
              output: content.output,
              providerExecuted: content.providerExecuted
            });
          } else if (content.type === 'tool-error') {
            uiMessage.parts.push({
              type: `tool-${content.toolName}`,
              toolCallId: content.toolCallId,
              state: 'output-error',
              input: content.input,
              errorText: content.error?.toString() || 'Tool error occurred',
              providerExecuted: content.providerExecuted
            });
          }
        });

        if (uiMessage.parts.length > 0) {
          messagesToSave.push(uiMessage);
        }

        // Save the messages from this step to the database
        if (messagesToSave.length > 0) {
          await saveMessagesToDB({
            chatSessionId,
            userId,
            messages: messagesToSave,
            isFirstStep: stepCount === 0,
            assistantMessageId
          });
        }

        // Increment step counter
        stepCount++;
      } catch (error) {
        console.error(`Error saving step ${stepCount} to database:`, error);
      }
    },
    onError: async (error) => {
      console.error('Error processing chat:', error);
    }
  });

  result.consumeStream();

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
    sendSources: true,
    onError: errorHandler
  });
}
