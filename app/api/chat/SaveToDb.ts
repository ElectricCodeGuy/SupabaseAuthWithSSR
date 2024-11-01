import { createServerSupabaseClient } from '@/lib/server/server';

export type OpenAiLog = {
  id: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

export const saveChatToSupbabase = async (
  chatSessionId: string,
  userId: string,
  currentMessageContent: string,
  completion: string,
  sources?: string[]
): Promise<void> => {
  if (!chatSessionId) {
    console.warn('Chat session ID is empty. Skipping saving chat to Supabase.');
    return;
  }
  const supabase = await createServerSupabaseClient();
  try {
    // Upsert the chat session
    const { error: sessionError } = await supabase.from('chat_sessions').upsert(
      {
        id: chatSessionId,
        user_id: userId,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'id' }
    );

    if (sessionError) throw sessionError;

    // Prepare messages data
    const messagesData = [
      {
        chat_session_id: chatSessionId,
        is_user_message: true,
        content: currentMessageContent
      },
      {
        chat_session_id: chatSessionId,
        is_user_message: false,
        content: completion,
        sources: sources && sources.length > 0 ? sources : null
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
