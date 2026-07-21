'use server';

import { getSession } from '@/lib/server/supabase';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/server/server';
import { createAdminClient } from '@/lib/server/admin';
import { refresh } from 'next/cache';

// NOTE: server actions return { success, message } instead of throwing —
// throwing from a server action surfaces as a generic, unusable error on the
// client. Callers check `success` and show the message on failure.

export async function deleteChatData(chatId: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'User not authenticated' };
  }

  const supabase = await createServerSupabaseClient();
  // message_parts are removed via ON DELETE CASCADE
  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', chatId);

  if (error) {
    console.error('Error during deletion:', error);
    return { success: false, message: 'Error deleting chat data' };
  }

  refresh();
  return { success: true, message: 'Chat data deleted successfully' };
}


const updateChatTitleSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty'),
  chatId: z.uuid('Invalid chat ID format')
});

export async function updateChatTitle(formData: FormData) {
  const result = updateChatTitleSchema.safeParse({
    title: formData.get('title'),
    chatId: formData.get('chatId')
  });

  if (!result.success) {
    console.error('Invalid input:', result.error);
    return { success: false, message: `Invalid input: ${result.error.message}` };
  }

  const { title, chatId } = result.data;

  const session = await getSession();
  if (!session) {
    return { success: false, message: 'User not authenticated' };
  }

  const supabaseAdmin = createAdminClient();
  const { error: updateError } = await supabaseAdmin
    .from('chat_sessions')
    .update({ chat_title: title })
    .eq('id', chatId)
    .eq('user_id', session.sub);

  if (updateError) {
    return {
      success: false,
      message: `Failed to update chat title: ${updateError.message}`
    };
  }

  refresh();
  return { success: true, message: 'Chat title updated' };
}

export async function setChatFavorite(chatId: string, favorite: boolean) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'User not authenticated' };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('chat_sessions')
    .update({ is_favorite: favorite })
    .eq('id', chatId);

  if (error) {
    return {
      success: false,
      message: `Failed to update favorite: ${error.message}`
    };
  }

  refresh();
  return { success: true };
}

export async function shareChat(chatId: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'User not authenticated' };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('chat_sessions')
    .update({ is_public: true })
    .eq('id', chatId);

  if (error) {
    return { success: false, message: `Failed to share chat: ${error.message}` };
  }

  refresh();
  return { success: true };
}

export async function unshareChat(chatId: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'User not authenticated' };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('chat_sessions')
    .update({ is_public: false })
    .eq('id', chatId);

  if (error) {
    return {
      success: false,
      message: `Failed to unshare chat: ${error.message}`
    };
  }

  refresh();
  return { success: true };
}

