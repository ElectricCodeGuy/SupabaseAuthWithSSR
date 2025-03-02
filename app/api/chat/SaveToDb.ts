import 'server-only';
import { createServerSupabaseClient } from '@/lib/server/server';

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
  reasoning?: string,
  sources?: string[]
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
        created_at: now.toISOString() // User message timestamp
      },
      {
        chat_session_id: chatSessionId,
        is_user_message: false,
        content: completion,
        reasoning: reasoning || null,
        sources: sources && sources.length > 0 ? sources : null,
        created_at: aiMessageTime.toISOString() // AI message timestamp (1 second later)
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
