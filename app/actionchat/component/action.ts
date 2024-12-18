'use server';

import { getSession } from '@/lib/server/supabase';
import { createServerSupabaseClient } from '@/lib/server/server';
import { revalidateTag } from 'next/cache';

export async function fetchChatPreviews(offset: number, limit: number) {
  const supabase = await createServerSupabaseClient();
  const session = await getSession();

  if (!session) {
    throw new Error('User not authenticated');
  }

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

    // Truncate the content after fetching
    return data.map((chat) => ({
      ...chat,
      chat_messages: chat.chat_messages.map((message) => ({
        content: message.content ? message.content.substring(0, 50) : ''
      }))
    }));
  } catch (error) {
    console.error('Error fetching chat previews:', error);
    return [];
  }
}

export async function deleteChatData(chatId: string) {
  const session = await getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }
  const supabase = await createServerSupabaseClient();
  try {
    // Delete chat session
    const { error: sessionError } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', chatId)
      .eq('user_id', session.id);

    if (sessionError) throw sessionError;
    revalidateTag('chat-history');
    return { message: 'Chat data and references deleted successfully' };
  } catch (error) {
    console.error('Error during deletion:', error);
    return { message: 'Error deleting chat data' };
  }
}
