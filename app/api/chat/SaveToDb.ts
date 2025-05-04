import 'server-only';
import { createServerSupabaseClient } from '@/lib/server/server';
import type { Attachment } from 'ai';
import type { LanguageModelV1Source } from '@ai-sdk/provider';
import type { ToolResult } from '@/app/chat/types/tooltypes';

export interface OpenAiLog {
  id: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export const saveChatToSupbabase = async (
  chatSessionId: string,
  userId: string,
  currentMessageContent: string,
  completion: string,
  attachments?: Attachment[],
  reasoning?: string,
  sources?: LanguageModelV1Source[],
  toolInvocations?: ToolResult[]
): Promise<void> => {
  if (!chatSessionId) {
    console.warn('Chat session ID is empty. Skipping saving chat to Supabase.');
    return;
  }
  const supabase = await createServerSupabaseClient();
  try {
    const now = new Date();
    // Add a small delay (1 second) for the AI message
    const aiMessageTime = new Date(now.getTime() + 1000);

    // Upsert the chat session
    const { error: sessionError } = await supabase.from('chat_sessions').upsert(
      {
        id: chatSessionId,
        user_id: userId,
        updated_at: aiMessageTime.toISOString() // Use the later timestamp
      },
      { onConflict: 'id' }
    );

    if (sessionError) throw sessionError;

    // Prepare messages data with different timestamps
    const messagesData = [
      {
        chat_session_id: chatSessionId,
        is_user_message: true,
        content: currentMessageContent,
        attachments: attachments ? JSON.stringify(attachments) : null,
        created_at: now.toISOString() // User message timestamp
      },
      {
        chat_session_id: chatSessionId,
        is_user_message: false,
        content: completion,
        reasoning: reasoning || null,
        sources: sources && sources.length > 0 ? sources : null,
        tool_invocations: toolInvocations
          ? JSON.stringify(toolInvocations)
          : null,
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
