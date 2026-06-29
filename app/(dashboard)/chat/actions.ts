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

const deleteFileSchema = z.object({
  file_name: z.string(),
  file_id: z.string()
});

export async function deleteFilterTagAndDocumentChunks(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'User not authenticated' };
  }

  const result = deleteFileSchema.safeParse({
    file_name: formData.get('file_name'),
    file_id: formData.get('file_id')
  });

  if (!result.success) {
    console.error('Validation failed:', result.error.issues);
    return {
      success: false,
      message: result.error.issues.map((issue) => issue.message).join(', ')
    };
  }

  const { file_name, file_id } = result.data;
  const userId = session.sub;

  const supabase = await createServerSupabaseClient();
  const fileToDelete = userId + '/' + file_name;

  // Delete the file from storage
  const { error: deleteError } = await supabase.storage
    .from('userfiles')
    .remove([fileToDelete]);

  if (deleteError) {
    console.error('Error deleting file from Supabase storage:', deleteError);
    return { success: false, message: 'Error deleting file from storage' };
  }

  // Find and delete document records with the matching id
  // Vector records are deleted automatically via ON DELETE CASCADE
  const { data: deletedData, error: docDeleteError } = await supabase
    .from('user_documents')
    .delete()
    .eq('user_id', userId)
    .eq('id', file_id)
    .select('id, title');

  if (docDeleteError) {
    console.error('Error deleting document records:', docDeleteError);
    return { success: false, message: 'Error deleting document metadata' };
  }

  const deletedCount = deletedData?.length || 0;
  refresh();

  return {
    success: true,
    message: `Successfully deleted file and ${deletedCount} associated documents`
  };
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

// Persist the user's chosen model on their users row. The FK to ai_models
// rejects unknown model_ids, and RLS limits the update to the user's own row.
export async function setSelectedModel(modelId: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'User not authenticated' };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('users')
    .update({ selected_model: modelId })
    .eq('id', session.sub);

  if (error) {
    return {
      success: false,
      message: `Failed to update model: ${error.message}`
    };
  }

  return { success: true };
}
