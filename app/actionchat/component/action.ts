'use server';

import { getSession } from '@/lib/server/supabase';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/server/server';
import { createAdminClient } from '@/lib/server/admin';

export type ChatPreview = {
  id: string;
  firstMessage: string;
  created_at: string;
};

export async function fetchMoreChatPreviews(offset: number) {
  const session = await getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }

  const supabase = await createServerSupabaseClient();
  const limit = 30;

  try {
    const { data, error } = await supabase
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
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const chatPreviews: ChatPreview[] = data.map((session) => ({
      id: session.id,
      firstMessage: session.chat_messages[0]?.content || 'No messages yet',
      created_at: session.created_at
    }));

    return chatPreviews;
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
