'use server';

import { getSession } from '@/lib/server/supabase';
import { createServerSupabaseClient } from '@/lib/server/server';

export async function fetchChatPreviews(offset: number, limit: number) {
  const session = await getSession();
  if (!session) {
    return [];
  }
  const supabase = createServerSupabaseClient();

  try {
    const query = supabase
      .from('chat_sessions')
      .select(
        `
        id,
        created_at,
        chat_messages (
          content
        )
      `
      )
      .eq('user_id', session.id)
      .eq('chat_messages.is_user_message', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
      .order('created_at', {
        referencedTable: 'chat_messages',
        ascending: true
      })
      .limit(1, { foreignTable: 'chat_messages' });

    const { data, error } = await query;

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching chat previews:', error);
    return [];
  }
}
export async function deleteChatData(chatId: string) {
  const session = await getSession();
  if (!session) {
    return { message: 'User not authenticated' };
  }
  const supabase = createServerSupabaseClient();
  try {
    // Delete chat session
    const { error: sessionError } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', chatId)
      .eq('user_id', session.id);

    if (sessionError) throw sessionError;

    return { message: 'Chat data and references deleted successfully' };
  } catch (error) {
    console.error('Error during deletion:', error);
    return { message: 'Error deleting chat data' };
  }
}
