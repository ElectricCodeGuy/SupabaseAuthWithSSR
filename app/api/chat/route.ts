import { type NextRequest, NextResponse } from 'next/server';
import type { UIMessage } from 'ai';
import {
  streamText,
  convertToModelMessages,
  isStepCount,
  createIdGenerator,
  pruneMessages,
  toUIMessageStream,
  createUIMessageStreamResponse
} from 'ai';
import type { AnthropicProviderOptions } from '@ai-sdk/anthropic';
import { anthropic } from '@ai-sdk/anthropic';
import { getSession } from '@/lib/server/supabase';
import { getSelectedModelId } from '@/app/(dashboard)/chat/models';
import { saveMessagesToDB } from './SaveToDbIncremental';
import {
  errorHandler,
  resolveModelId,
  generateChatTitle,
  buildStepUsage
} from './chatHelpers';
import { searchUserDocument } from './tools/documentChat';
import { websiteSearchTool } from './tools/WebsiteSearchTool';
import {
  saveMemory,
  fetchUserMemories,
  formatMemoriesForPrompt
} from './tools/MemoryTool';
import { conversationSearch } from './tools/ConversationSearchTool';
import { createChart } from './tools/ChartTool';
import { createPDF } from './tools/CreatePDFTool';
import {
  buildArtifactStore,
  buildArtifactPrompt,
  createArtifactTool,
  updateArtifactTool
} from './tools/ArtifactTool';

export const maxDuration = 60;

// Static system prompt — identical across turns and across users, so it
// carries the Anthropic prompt-cache breakpoint. NOTHING per-user or
// per-request (dates, names, ids) may appear in or before this block.
const staticSystemPrompt = `You are a helpful assistant. Answer all questions to the best of your ability. Use tools when they genuinely help; don't re-query the same source with rephrasings of the same question.

TOOL GUIDE:
- searchUserDocument: look up and search the user's uploaded documents. Use when the user asks about their documents, references a file, or the question likely concerns uploaded content. First "list"/"findByName" to locate documents, then "searchContent".
- websiteSearchTool: search the web for up-to-date information. Use for questions about recent events or facts that may have changed.
- conversationSearch: search the user's past chats. Use when the user references something discussed in an earlier conversation ("what did we say about...", "find the chat where..."). Include the returned links in your answer.
- saveMemory: manage long-term memories. ONLY when the user explicitly asks you to remember, forget, or list what you remember — never for facts mentioned in passing. Stored memories appear in <userMemories>.
- createChart: render an interactive chart. Use when the user asks for a visualization, or when a comparison/trend/breakdown you are presenting is clearer as a chart. Only chart real data from the conversation or tool results — never invent numbers. After the chart renders, add interpretation instead of repeating the numbers as a list.
- createPDF: generate a polished PDF document saved to the user's files. Use when the user asks for a PDF, report, memo, letter, or contract as a downloadable file. Afterwards, tell the user it is ready in the panel above — don't also paste the full content into the chat.

FORMATTING: Your responses are rendered using react-markdown with the following capabilities:
- GitHub Flavored Markdown (GFM) support through remarkGfm plugin
- Syntax highlighting for code blocks through rehypeHighlight plugin
- All standard markdown formatting`;

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
  // Client disconnects / stop-button aborts arrive via the request signal —
  // an AbortSignal can't be serialized into the JSON body.
  const abortSignal = req.signal;

  if (!chatSessionId) {
    return new NextResponse('Chat session ID is empty.', {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // The conversation's model comes over in the request body (the picker is
  // client state — it must work before the chat session row even exists).
  // resolveModelId validates it against the active anthropic catalog, so a
  // tampered body can only ever select a real, allowed model. When absent,
  // fall back to the user's default model from their users row.
  const userId = session.sub;
  const requestedModel =
    typeof body.selectedModel === 'string' && body.selectedModel
      ? body.selectedModel
      : null;
  const [selectedModel, userMemories] = await Promise.all([
    (requestedModel
      ? Promise.resolve(requestedModel)
      : getSelectedModelId()
    ).then(resolveModelId),
    fetchUserMemories(userId)
  ]);

  let stepCount = 0;
  let userMessageSaved = false;
  const assistantMessageId = crypto.randomUUID();
  const isFirstMessage = messages.length === 1;

  // Conversation-specific state persisted on the chat session (JSON col).
  // Written with every save, so the stored model always reflects the last
  // generation; the chat page restores the picker from it on reopen.
  const chatSettings = { model: selectedModel };

  // Latest state of every workspace document in this conversation — seeded
  // from history, mutated by the artifact tools during the turn. Injected
  // into the dynamic system block because pruneMessages strips older tool
  // parts (and with them the document contents) from the model's context.
  const artifactStore = buildArtifactStore(messages);

  const modelMessages = await convertToModelMessages(messages, {
    ignoreIncompleteToolCalls: true
  });
  // Keep tool calls/results from roughly the last two exchanges so (1) the
  // moving cache breakpoint below still matches the previous request's prefix
  // (0.1× reads) and (2) the model retains recent tool output for follow-ups.
  // Older tool content and reasoning are pruned to keep the prompt lean.
  const prunedMessages = pruneMessages({
    messages: modelMessages,
    reasoning: 'before-last-message',
    toolCalls: 'before-last-12-messages',
    emptyMessages: 'remove'
  });

  const result = streamText({
    model: anthropic(selectedModel),
    abortSignal,
    // Two system blocks, ordered by change frequency for Anthropic prompt
    // caching (prefix match; render order is tools → system → messages):
    // 1. staticSystemPrompt — carries the breakpoint. Because tools render
    //    BEFORE system, this single breakpoint caches the tool definitions +
    //    the static instructions in one entry, shared across turns and users.
    // 2. dynamic block (date, memories, artifacts) — uncached tail; never
    //    busts the cached prefix.
    instructions: [
      {
        role: 'system',
        content: staticSystemPrompt,
        providerOptions: {
          anthropic: { cacheControl: { type: 'ephemeral' } }
        }
      },
      {
        role: 'system',
        content: [
          `The current date is ${new Date().toISOString().slice(0, 10)}.`,
          formatMemoriesForPrompt(userMemories),
          buildArtifactPrompt(artifactStore)
        ]
          .filter(Boolean)
          .join('\n\n')
      }
    ],
    messages: prunedMessages,
    providerOptions: {
      anthropic: {
        effort: 'high',
        thinking: { type: 'adaptive', display: 'summarized' }
      } satisfies AnthropicProviderOptions
    },
    tools: {
      websiteSearchTool: websiteSearchTool,
      searchUserDocument: searchUserDocument({ userId }),
      saveMemory: saveMemory({ userId }),
      conversationSearch: conversationSearch({
        userId,
        currentChatId: chatSessionId
      }),
      createChart: createChart,
      createPDF: createPDF({ userId }),
      createArtifact: createArtifactTool({ store: artifactStore }),
      updateArtifact: updateArtifactTool({ store: artifactStore })
    },
    activeTools: [
      'websiteSearchTool',
      'searchUserDocument',
      'saveMemory',
      'conversationSearch',
      'createChart',
      'createPDF',
      'createArtifact',
      'updateArtifact'
    ],
    // 10 steps gives multi-tool chains room: e.g. web search → chart →
    // PDF → memory is 4 tool calls + follow-up lookups + the final answer.
    stopWhen: isStepCount(10),
    // Moving cache breakpoint: mark the LAST message on every step, so
    // steps 2-10 and the next user turn get cache reads covering the
    // conversation INCLUDING prior steps' tool outputs. Earlier marks are
    // stripped first so they don't accumulate across steps (Anthropic allows
    // max 4 breakpoints per request and silently drops the newest ones).
    prepareStep: ({ messages }) => {
      if (messages.length === 0) return {};
      const stripped = messages.map((message) => {
        const anthropicOptions = message.providerOptions?.anthropic;
        if (!anthropicOptions || !('cacheControl' in anthropicOptions)) {
          return message;
        }
        const { cacheControl: _dropped, ...rest } = anthropicOptions;
        return {
          ...message,
          providerOptions: { ...message.providerOptions, anthropic: rest }
        };
      });
      const last = stripped[stripped.length - 1];
      stripped[stripped.length - 1] = {
        ...last,
        providerOptions: {
          ...last.providerOptions,
          anthropic: {
            ...(last.providerOptions?.anthropic ?? {}),
            cacheControl: { type: 'ephemeral' }
          }
        }
      };
      return { messages: stripped };
    },
    onAbort: async () => {
      // An abort before the first step completed means onStepEnd never ran —
      // persist the user message so the chat still exists on reload.
      if (!userMessageSaved) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage) {
          try {
            await saveMessagesToDB({
              chatSessionId,
              userId,
              messages: [lastMessage],
              isFirstStep: true,
              assistantMessageId,
              settings: chatSettings
            });
            userMessageSaved = true;
          } catch (error) {
            console.error('Error saving aborted chat to database:', error);
          }
        }
      }
    },
    // Save each step as it completes
    onStepEnd: async (stepResult) => {
      try {
        const messagesToSave: UIMessage[] = [];

        // Until the first save has succeeded, include the user message —
        // a failed first save is retried on the next step.
        const isFirstSave = !userMessageSaved;
        if (isFirstSave) {
          const lastMessage = messages[messages.length - 1];
          if (lastMessage) {
            messagesToSave.push(lastMessage);
          }
        }

        // Build UIMessage from the step result content - use same message ID
        // for all steps so the parts accumulate under one message.
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

        if (messagesToSave.length > 0) {
          await saveMessagesToDB({
            chatSessionId,
            userId,
            messages: messagesToSave,
            isFirstStep: isFirstSave,
            assistantMessageId,
            stepUsage: buildStepUsage(selectedModel, stepResult),
            settings: chatSettings
          });
          // Only mark as saved after the write succeeded.
          userMessageSaved = true;
        }
      } catch (error) {
        console.error(`Error saving step ${stepCount} to database:`, error);
      } finally {
        stepCount++;
      }
    },
    onError: async ({ error }) => {
      console.error('Error processing chat:', error);
    }
  });

  result.consumeStream();

  const uiMessageStream = toUIMessageStream({
    stream: result.stream,
    originalMessages: messages,
    generateMessageId: createIdGenerator({
      prefix: 'msg',
      size: 8
    }),
    sendReasoning: true,
    sendSources: true,
    // Runs once the full UI message stream has been delivered — the cheap
    // Haiku title call happens here so it never delays the response itself.
    // The assistant's finished answer rides along for a better title.
    onFinish: async ({ responseMessage }) => {
      if (isFirstMessage) {
        await generateChatTitle({
          chatSessionId,
          userId,
          firstMessage: messages[0],
          responseMessage
        });
      }
    },
    onError: (error: unknown) => {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      console.error('Streaming error:', errorObj);
      return errorHandler(error);
    }
  });

  return createUIMessageStreamResponse({ stream: uiMessageStream });
}
