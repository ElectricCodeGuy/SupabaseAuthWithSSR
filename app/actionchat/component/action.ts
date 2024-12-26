'use server';

import { getSession } from '@/lib/server/supabase';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/server/server';
import { revalidateTag } from 'next/cache';
import { Pinecone } from '@pinecone-database/pinecone';
import { decodeBase64 } from '../lib/base64';

const indexName = process.env.PINECONE_INDEX_NAME!;

const pinecone = new Pinecone();

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

const deleteFileSchema = z.object({
  filePath: z.string()
});
function sanitizeFilename(filename: string): string {
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}
export async function deleteFilterTagAndDocumentChunks(formData: FormData) {
  const session = await getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }
  try {
    const result = deleteFileSchema.safeParse({
      filePath: formData.get('filePath')
    });

    if (!result.success) {
      console.error('Validation failed:', result.error.errors);
      return {
        success: false,
        message: result.error.errors.map((e) => e.message).join(', ')
      };
    }

    const { filePath } = result.data;

    const supabase = await createServerSupabaseClient();
    const filetodelete = session.id + '/' + filePath;

    const { error: deleteError } = await supabase.storage
      .from('userfiles')
      .remove([filetodelete]);

    if (deleteError) {
      console.error('Error deleting file from Supabase storage:', deleteError);
      return {
        success: false,
        message: 'Error deleting file from storage'
      };
    }

    const index = pinecone.index(indexName).namespace(`document_${session.id}`);

    const prefixToDelete = decodeBase64(filePath);
    const sanitizedFilename = sanitizeFilename(prefixToDelete);
    let allVectorIds: string[] = [];
    let paginationToken: string | undefined;

    do {
      const listResult = await index.listPaginated({
        prefix: sanitizedFilename,
        paginationToken
      });

      if (listResult.vectors) {
        const pageVectorIds = listResult.vectors
          .map((vector) => vector.id)
          .filter((id): id is string => id !== undefined);
        allVectorIds = allVectorIds.concat(pageVectorIds);
      }

      paginationToken = listResult.pagination?.next;
    } while (paginationToken);

    // Delete vectors in batches (if needed)
    const batchSize = 50; // Adjust based on Pinecone's limits
    for (let i = 0; i < allVectorIds.length; i += batchSize) {
      const batch = allVectorIds.slice(i, i + batchSize);

      await index.deleteMany(batch);
    }
  } catch (error) {
    console.error('Error during deletion process:', error);
    return {
      success: false,
      message: 'Error deleting file and document chunks',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
