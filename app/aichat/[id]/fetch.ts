import 'server-only';

import { createServerSupabaseClient } from '@/lib/server/server';
import { unstable_noStore as noStore } from 'next/cache';
import { type Message } from '@ai-sdk/react';

interface ChatSource {
  sourceType: string;
  id: string;
  url: string;
}

interface SupabaseChatMessage {
  id: string;
  is_user_message: boolean;
  content: string | null;
  created_at: string;
  sources: unknown;
  reasoning: string | null;
}

function parseSources(sources: unknown): ChatSource[] {
  if (!sources) return [];
  try {
    if (typeof sources === 'string') {
      return JSON.parse(sources) as ChatSource[];
    }
    if (Array.isArray(sources)) {
      return sources as ChatSource[];
    }
    return [];
  } catch (error) {
    console.error('Error parsing sources:', error);
    return [];
  }
}

export function formatMessages(messages: SupabaseChatMessage[]): Message[] {
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

    // Add source parts if available
    if (parseSources(message.sources).length > 0) {
      messageParts.push(
        ...parseSources(message.sources).map((source) => ({
          type: 'source' as const,
          source: {
            sourceType: 'url' as const,
            id: source.id,
            url: source.url
          }
        }))
      );
    }

    return {
      role: message.is_user_message ? 'user' : 'assistant',
      id: message.id,
      content: message.content ?? '',
      parts: messageParts
    };
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
          reasoning
        )
      `
      )
      .eq('id', chatId)
      .order('created_at', {
        ascending: true,
        referencedTable: 'chat_messages'
      })
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching chat data from Supabase:', error);
    return null;
  }
}
