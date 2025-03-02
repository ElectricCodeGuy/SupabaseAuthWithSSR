import type React from 'react';
import { type StreamableValue, type createAI } from 'ai/rsc';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

export const getModel = (selectedModel: 'claude3' | 'chatgpt4') => {
  if (selectedModel === 'claude3') {
    return anthropic('claude-3-7-sonnet-20250219');
  } else if (selectedModel === 'chatgpt4') {
    return openai('gpt-4o');
  }
  return anthropic('claude-3-7-sonnet-20250219');
};

export interface ServerMessage {
  role: 'user' | 'assistant';
  content: string;
  name?: string;
  sources?: Source[];
}
export interface ResetResult {
  success: boolean;
  message: string;
}
export interface ClientMessage {
  id: string | number | null;
  role: 'user' | 'assistant';
  display: React.ReactNode;
  chatId?: string | null;
}

export interface SubmitMessageResult {
  success?: boolean;
  message?: string;
  limit?: number;
  remaining?: number;
  reset?: number;
  id?: string;
  display?: React.ReactNode;
  chatId?: string;
  status: StreamableValue<string>;
}
import 'server-only';
import { createServerSupabaseClient } from '@/lib/server/server';

export interface Source {
  title: string;
  url: string;
}

export const saveChatToSupbabase = async (
  chatSessionId: string,
  userId: string,
  currentMessageContent: string,
  completion: string,
  sources?: Source[]
): Promise<void> => {
  if (!chatSessionId) {
    console.warn('Chat session ID is empty. Skipping saving chat to Supabase.');
    return;
  }
  const supabase = await createServerSupabaseClient();
  const now = new Date();
  // Add a small delay (1 second) for the AI message
  const aiMessageTime = new Date(now.getTime() + 1000);

  try {
    // Upsert the chat session
    const { error: sessionError } = await supabase.from('chat_sessions').upsert(
      {
        id: chatSessionId,
        user_id: userId,
        updated_at: aiMessageTime.toISOString()
      },
      { onConflict: 'id' }
    );

    if (sessionError) throw sessionError;

    // Prepare messages data
    const messagesData = [
      {
        chat_session_id: chatSessionId,
        is_user_message: true,
        content: currentMessageContent,
        sources: null,
        created_at: now.toISOString()
      },
      {
        chat_session_id: chatSessionId,
        is_user_message: false,
        content: completion,
        sources: sources ? JSON.stringify(sources) : null,
        created_at: aiMessageTime.toISOString()
      }
    ];

    // Insert both messages in a single query
    const { error: messagesError } = await supabase
      .from('chat_messages')
      .insert(messagesData);

    if (messagesError) throw messagesError;
  } catch (error) {
    console.error('Error saving chat to Supabase:', error);
  }
};

export interface AIActions {
  submitMessage: (
    currentUserMessage: string,
    model_select: 'claude3' | 'chatgpt4',
    chatId: string
  ) => Promise<SubmitMessageResult>;
  uploadFilesAndQuery: (
    currentUserMessage: string,
    chatId: string,
    model_select: 'claude3' | 'chatgpt4',
    selectedFiles: string[]
  ) => Promise<SubmitMessageResult>;
  SearchTool: (
    currentUserMessage: string,
    model_select: 'claude3' | 'chatgpt4',
    chatId: string
  ) => Promise<SubmitMessageResult>;
  resetMessages: () => Promise<ResetResult>;
  [key: string]: (...args: any[]) => Promise<any>;
}

export interface AIProviderProps {
  children: React.ReactNode;
  initialAIState?: ServerMessage[];
  initialUIState?: ClientMessage[];
  $ActionTypes?: AIActions;
}

export type AI = ReturnType<
  typeof createAI<ServerMessage[], ClientMessage[], AIActions>
>;
