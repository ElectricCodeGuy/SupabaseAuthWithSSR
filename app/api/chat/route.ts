import { type NextRequest, NextResponse } from 'next/server';
import type { UIMessage } from 'ai';
import { streamText, convertToModelMessages, stepCountIs } from 'ai';
import { saveMessagesToDB } from './SaveToDbIncremental';
import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { openai } from '@ai-sdk/openai';
import type { AnthropicProviderOptions } from '@ai-sdk/anthropic';
import { anthropic } from '@ai-sdk/anthropic';
import { getSession } from '@/lib/server/supabase';
import { searchUserDocument } from './tools/documentChat';
import { google } from '@ai-sdk/google';
import type { GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';
import type { SharedV2ProviderMetadata } from '@ai-sdk/provider';
import { websiteSearchTool } from './tools/WebsiteSearchTool';

export const dynamic = 'force-dynamic';

export const maxDuration = 60;

const systemPrompt = `You are a helpful assistant. Answer all questions to the best of your ability. Use tools when necessary. Strive to only use a tool one time per question.

You have access to a searchUserDocument tool that can search through the user's uploaded documents. Use this tool when:
- The user asks questions about their documents
- The user references specific files or uploads
- The question seems related to content that might be in their documents

FORMATTING: Your responses are rendered using react-markdown with the following capabilities:
- GitHub Flavored Markdown (GFM) support through remarkGfm plugin
- Syntax highlighting for code blocks through rehypeHighlight plugin
- All standard markdown formatting`;

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
      return anthropic('claude-sonnet-4-5');
    case 'gpt-5':
      return openai('gpt-5.1');
    case 'gpt-5-mini':
      return openai('gpt-5-mini');
    case 'o3':
      return openai('o3-2025-04-16');
    case 'gemini-3-pro-preview':
      return google('gemini-3-pro-preview');
    case 'gemini-2.5-flash-preview-09-2025':
      return google('gemini-2.5-flash-preview-09-2025-preview-09-2025');
    default:
      console.error('Invalid model selected:', selectedModel);
      return openai('gpt-5.1');
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

  const body = await req.json();
  const messages: UIMessage[] = body.messages ?? [];
  const chatSessionId = body.chatId;
  const signal = body.signal;

  if (!chatSessionId) {
    return new NextResponse('Chat session ID is empty.', {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  const selectedModel = body.option ?? 'gpt-5';
  const userId = session.sub;

  const providerOptions: SharedV2ProviderMetadata = {};
  if (selectedModel === 'claude-3.7-sonnet') {
    providerOptions.anthropic = {
      thinking: { type: 'enabled', budgetTokens: 12000 }
    } satisfies AnthropicProviderOptions;
  }

  if (
    selectedModel === 'gemini-3-pro-preview' ||
    selectedModel === 'gemini-3-flash-preview'
  ) {
    providerOptions.google = {
      thinkingConfig: {
        thinkingBudget: 2048,
        includeThoughts: true
      }
    } satisfies GoogleGenerativeAIProviderOptions;
  }

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

  let stepCount = 0;
  let userMessageSaved = false;
  const assistantMessageId = crypto.randomUUID();

  const result = streamText({
    model: getModel(selectedModel),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    abortSignal: signal,
    providerOptions,
    tools: {
      websiteSearchTool: websiteSearchTool,
      searchUserDocument: searchUserDocument({ userId })
    },
    activeTools: ['websiteSearchTool', 'searchUserDocument'],
    stopWhen: stepCountIs(5),
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

        // Build UIMessage from the step result content
        const uiMessage: UIMessage = {
          id: assistantMessageId,
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
              filename: undefined,
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
