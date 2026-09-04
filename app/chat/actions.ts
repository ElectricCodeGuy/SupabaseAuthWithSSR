'use server';

import { z } from 'zod';
import { refresh } from 'next/cache';
import { getSession } from '@/lib/server/supabase';
import { createServerSupabaseClient } from '@/lib/server/server';

// NOTE: server actions return { success, message } instead of throwing —
// throwing from a server action surfaces as a generic, unusable error on the
// client. Callers check `success` and show the message on failure.
//
// Every mutation goes through the session client, so RLS on chat_sessions
// (user_id = auth.uid()) is what scopes it to the caller's own chats. Ids
// are validated up front so a malformed id fails fast instead of surfacing
// as a database error.

const chatIdSchema = z.uuid();

const updateChatTitleSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(200),
  chatId: chatIdSchema
});

type ActionResult = { success: boolean; message?: string };

async function updateOwnChat(
  chatId: string,
  patch: { chat_title?: string; is_favorite?: boolean; is_public?: boolean },
  failureMessage: string
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'User not authenticated' };
  }
  if (!chatIdSchema.safeParse(chatId).success) {
    return { success: false, message: 'Invalid chat ID' };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('chat_sessions')
    .update(patch)
    .eq('id', chatId)
    .eq('user_id', session.sub);

  if (error) {
    console.error(`${failureMessage}:`, error);
    return { success: false, message: failureMessage };
  }

  refresh();
  return { success: true };
}

export async function deleteChatData(chatId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'User not authenticated' };
  }
  if (!chatIdSchema.safeParse(chatId).success) {
    return { success: false, message: 'Invalid chat ID' };
  }

  const supabase = await createServerSupabaseClient();
  // message_parts are removed via ON DELETE CASCADE
  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', chatId)
    .eq('user_id', session.sub);

  if (error) {
    console.error('Error during deletion:', error);
    return { success: false, message: 'Error deleting chat data' };
  }

  refresh();
  return { success: true, message: 'Chat data deleted successfully' };
}

export async function updateChatTitle(
  formData: FormData
): Promise<ActionResult> {
  const result = updateChatTitleSchema.safeParse({
    title: formData.get('title'),
    chatId: formData.get('chatId')
  });

  if (!result.success) {
    return {
      success: false,
      message: result.error.issues[0]?.message ?? 'Invalid input'
    };
  }

  const { title, chatId } = result.data;
  const outcome = await updateOwnChat(
    chatId,
    { chat_title: title },
    'Failed to update chat title'
  );
  return outcome.success
    ? { success: true, message: 'Chat title updated' }
    : outcome;
}

export async function setChatFavorite(
  chatId: string,
  favorite: boolean
): Promise<ActionResult> {
  return updateOwnChat(
    chatId,
    { is_favorite: favorite === true },
    'Failed to update favorite'
  );
}

export async function shareChat(chatId: string): Promise<ActionResult> {
  return updateOwnChat(chatId, { is_public: true }, 'Failed to share chat');
}

export async function unshareChat(chatId: string): Promise<ActionResult> {
  return updateOwnChat(
    chatId,
    { is_public: false },
    'Failed to unshare chat'
  );
}
