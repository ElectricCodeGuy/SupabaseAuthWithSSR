import 'server-only';

import { createServerSupabaseClient } from '@/lib/server/server';
import { unstable_noStore as noStore } from 'next/cache';
import type { LanguageModelV1Source } from '@ai-sdk/provider';
import { type Message } from '@ai-sdk/react';
import type { Attachment, ToolInvocation } from '@ai-sdk/ui-utils';
import type { Tables } from '@/types/database';

type ChatMessage = Pick<
  Tables<'chat_messages'>,
  | 'id'
  | 'is_user_message'
  | 'content'
  | 'created_at'
  | 'sources'
  | 'reasoning'
  | 'attachments'
  | 'tool_invocations'
>;

function parseSources(sources: unknown): LanguageModelV1Source[] {
  if (!sources) return [];
  try {
    if (typeof sources === 'string') {
      return JSON.parse(sources) as LanguageModelV1Source[];
    }
    if (Array.isArray(sources)) {
      return sources as LanguageModelV1Source[];
    }
    return [];
  } catch (error) {
    console.error('Error parsing sources:', error);
    return [];
  }
}

// Function to parse attachments from JSON string or object
function parseAttachments(attachments: unknown): Attachment[] {
  if (!attachments) return [];

  try {
    if (typeof attachments === 'string') {
      return JSON.parse(attachments) as Attachment[];
    }
    if (Array.isArray(attachments)) {
      return attachments as Attachment[];
    }
    return [];
  } catch (error) {
    console.error('Error parsing attachments:', error);
    return [];
  }
}

function parseToolInvocations(toolInvocations: unknown): ToolInvocation[] {
  if (!toolInvocations) return [];

  try {
    let parsedData: any[] = [];

    if (typeof toolInvocations === 'string') {
      parsedData = JSON.parse(toolInvocations);
    } else if (Array.isArray(toolInvocations)) {
      parsedData = toolInvocations;
    } else {
      return [];
    }

    return parsedData.map((invocation: any) => {
      if (invocation.state) {
        return invocation;
      }

      if (invocation.type === 'tool-result') {
        const { _type, ...rest } = invocation;
        return {
          ...rest,
          state: 'result' as const
        };
      }

      return {
        ...invocation,
        state: invocation.result ? ('result' as const) : ('call' as const)
      };
    });
  } catch (error) {
    console.error('Error parsing tool invocations:', error);
    return [];
  }
}

export function formatMessages(messages: ChatMessage[]): Message[] {
  return messages.map((message) => {
    const messageParts = [];

    // Add the text part
    messageParts.push({
      type: 'text' as const,
      text: message.content ?? ''
    });

    // Add reasoning part if available (only for assistant messages)
    if (!message.is_user_message && message.reasoning) {
      messageParts.push({
        type: 'reasoning' as const,
        reasoning: message.reasoning,
        details: [
          {
            type: 'text' as const,
            text: message.reasoning
          }
        ]
      });
    }

    // Add source parts if available - now including title
    if (parseSources(message.sources).length > 0) {
      messageParts.push(
        ...parseSources(message.sources).map((source) => ({
          type: 'source' as const,
          source: {
            sourceType: 'url' as const,
            id: source.id,
            url: source.url,
            title: source.title
          }
        }))
      );
    }

    // Add tool invocation parts if available
    if (!message.is_user_message && message.tool_invocations) {
      const toolInvocations = parseToolInvocations(message.tool_invocations);

      if (toolInvocations.length > 0) {
        messageParts.push(
          ...toolInvocations.map((invocation: ToolInvocation) => ({
            type: 'tool-invocation' as const,
            toolInvocation: invocation
          }))
        );
      }
    }

    // Create the message object
    const formattedMessage: Message = {
      role: message.is_user_message ? 'user' : 'assistant',
      id: message.id,
      content: message.content ?? '',
      parts: messageParts,
      createdAt: new Date(message.created_at)
    };

    if (message.is_user_message && message.attachments) {
      const attachments = parseAttachments(message.attachments);

      if (attachments.length > 0) {
        formattedMessage.experimental_attachments = attachments.map(
          (attachment) => ({
            name: attachment.name,
            url: attachment.url,
            contentType: attachment.contentType || 'application/pdf'
          })
        );
      }
    }

    return formattedMessage;
  });
}

export async function fetchChat(chatId: string) {
  noStore();
  const supabase = await createServerSupabaseClient();
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select(
        `
        id,
        user_id,
        created_at,
        updated_at,
        chat_messages!inner (
          id,
          is_user_message,
          content,
          created_at,
          sources,
          reasoning,
          attachments,
          tool_invocations
        )
      `
      )
      .eq('id', chatId)
      .order('created_at', {
        ascending: true,
        referencedTable: 'chat_messages'
      })
      .maybeSingle();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching chat data from Supabase:', error);
    return null;
  }
}
