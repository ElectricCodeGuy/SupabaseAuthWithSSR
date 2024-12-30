'use server';

import { getSession } from '@/lib/server/supabase';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/server/server';
import { createAdminClient } from '@/lib/server/admin';
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
      .eq('id', chatId);

    if (sessionError) throw sessionError;
    revalidateTag('chat-history');
    return { message: 'Chat data and references deleted successfully' };
  } catch (error) {
    console.error('Error during deletion:', error);
    return { message: 'Error deleting chat data' };
  }
}

const deleteFileSchema = z.object({
  filePath: z.string(),
  filterTag: z.string()
});

export async function deleteFilterTagAndDocumentChunks(formData: FormData) {
  const session = await getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }

  try {
    const result = deleteFileSchema.safeParse({
      filePath: formData.get('filePath'),
      filterTag: formData.get('filterTag')
    });

    if (!result.success) {
      console.error('Validation failed:', result.error.errors);
      return {
        success: false,
        message: result.error.errors.map((e) => e.message).join(', ')
      };
    }

    const { filePath, filterTag } = result.data;
    const supabase = await createServerSupabaseClient();

    // Delete file from storage
    const fileToDelete = session.id + '/' + filePath;
    const { error: deleteStorageError } = await supabase.storage
      .from('userfiles')
      .remove([fileToDelete]);

    if (deleteStorageError) {
      console.error(
        'Error deleting file from Supabase storage:',
        deleteStorageError
      );
      return {
        success: false,
        message: 'Error deleting file from storage'
      };
    }

    // Delete vectors from vector_documents table

    const supabaseAdmin = createAdminClient();

    const { error: deleteVectorsError } = await supabaseAdmin
      .from('vector_documents')
      .delete()
      .eq('user_id', session.id)
      .eq('filter_tags', filterTag);

    if (deleteVectorsError) {
      console.error(
        'Error deleting vectors from database:',
        deleteVectorsError
      );
      return {
        success: false,
        message: 'Error deleting document vectors'
      };
    }

    return {
      success: true,
      message: 'File and associated vectors deleted successfully'
    };
  } catch (error) {
    console.error('Error during deletion process:', error);
    return {
      success: false,
      message: 'Error deleting file and document chunks',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
