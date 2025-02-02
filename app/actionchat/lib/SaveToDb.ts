import 'server-only';
import { createServerSupabaseClient } from '@/lib/server/server';

export type Source = {
  title: string;
  url: string;
};

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
        sources: null // User messages don't have sources
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
