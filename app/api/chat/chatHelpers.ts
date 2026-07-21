import 'server-only';

// Helpers for the chat API route: model resolution, auto-titling, error
// formatting, and per-step usage extraction. The system prompt, the
// prompt-caching logic and the message-persistence mapping deliberately
// stay IN route.ts — they are the heart of the route, not plumbing.
import { generateText } from 'ai';
import type { StepResult, ToolSet, UIMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createServerSupabaseClient } from '@/lib/server/server';
import {
  getModelConfig,
  DEFAULT_MODEL_ID
} from '@/app/(dashboard)/chat/models';
import type { StepUsage } from '@/types/usage';

// ── Errors ───────────────────────────────────────────────────────────────────
export function errorHandler(error: unknown) {
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

// ── Model resolution ─────────────────────────────────────────────────────────
// Anthropic-only: resolve the user's selected model against the active
// ai_models rows, but only accept anthropic-provider models. Anything else
// (stale google/openai selections) falls back to the first active anthropic
// model, then the hardcoded default.
export async function resolveModelId(selectedModel: string): Promise<string> {
  const config = await getModelConfig();
  const anthropicModels = config.filter((m) => m.provider === 'anthropic');

  const match = anthropicModels.find((m) => m.model_id === selectedModel);
  if (match) {
    return match.model_id;
  }

  console.warn('Non-anthropic or unknown model selected:', selectedModel);
  return anthropicModels[0]?.model_id ?? DEFAULT_MODEL_ID;
}

// ── Auto-titling ─────────────────────────────────────────────────────────────
const TITLE_SYSTEM_PROMPT = `Generate a short chat title (2-5 words) summarizing the conversation below.

Output ONLY the title text. No prefixes, no formatting.

Examples:
- "what's the weather in nyc" → Weather in NYC
- "help me write an essay about space" → Space Essay Help
- "hi" → New Conversation
- "debug my python code" → Python Debugging

Never output hashtags, prefixes like "Title:", or quotes. Answer in the same language as the user's message.`;

function extractText(message: UIMessage | undefined, maxChars: number): string {
  return (message?.parts ?? [])
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('\n')
    .trim()
    .slice(0, maxChars);
}

// One cheap Haiku call that writes chat_sessions.chat_title. Called from the
// stream's onFinish for brand-new conversations, so it never delays the
// response. Both the user's message and the assistant's answer feed the
// prompt — the answer often names the actual topic better than the question
// ("help me with this error" → the answer says what the error was).
// Titles are cosmetic — never fail the request over them.
export async function generateChatTitle({
  chatSessionId,
  userId,
  firstMessage,
  responseMessage
}: {
  chatSessionId: string;
  userId: string;
  firstMessage: UIMessage | undefined;
  responseMessage?: UIMessage;
}): Promise<void> {
  try {
    const firstUserText = extractText(firstMessage, 2000);
    if (!firstUserText) return;
    const assistantText = extractText(responseMessage, 1000);

    const { text } = await generateText({
      model: anthropic('claude-haiku-4-5'),
      system: TITLE_SYSTEM_PROMPT,
      prompt: assistantText
        ? `User message:\n${firstUserText}\n\nAssistant answer (excerpt):\n${assistantText}`
        : firstUserText
    });

    const title = text
      .replace(/^[#*"\s]+/, '')
      .replace(/["]+$/, '')
      .trim()
      .slice(0, 80);
    if (!title) return;

    const supabase = await createServerSupabaseClient();
    // Only fill an EMPTY title — a resent/regenerated first turn must never
    // clobber a name the user set (or an earlier generated one).
    await supabase
      .from('chat_sessions')
      .update({ chat_title: title })
      .eq('id', chatSessionId)
      .eq('user_id', userId)
      .is('chat_title', null);
  } catch (error) {
    console.error('Error generating chat title:', error);
  }
}

// Per-step token usage, stored as JSON with the step's first part. Every
// tool call is its own step, so this attributes token cost per tool call;
// the /usage and /admin dashboards aggregate it.
export function buildStepUsage(
  modelId: string,
  stepResult: StepResult<ToolSet>
): StepUsage {
  return {
    model_id: modelId,
    input_tokens: stepResult.usage?.inputTokens ?? 0,
    output_tokens: stepResult.usage?.outputTokens ?? 0,
    cache_read_tokens:
      stepResult.usage?.inputTokenDetails?.cacheReadTokens ?? 0,
    cache_write_tokens:
      stepResult.usage?.inputTokenDetails?.cacheWriteTokens ?? 0,
    tools: stepResult.content
      .filter(
        (part) => part.type === 'tool-result' || part.type === 'tool-error'
      )
      .map((part) => part.toolName)
  };
}
