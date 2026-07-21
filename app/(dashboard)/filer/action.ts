'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/server/supabase';
import { createServerSupabaseClient } from '@/lib/server/server';

const deleteFileSchema = z.object({
  file_path: z.string(),
  file_id: z.string()
});

export async function deleteUserFile(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'Not authorized' };
  }

  const result = deleteFileSchema.safeParse({
    file_path: formData.get('file_path'),
    file_id: formData.get('file_id')
  });

  if (!result.success) {
    return {
      success: false,
      message: result.error.issues.map((issue) => issue.message).join(', ')
    };
  }

  const { file_path, file_id } = result.data;
  const userId = session.sub;

  try {
    const supabase = await createServerSupabaseClient();

    // Delete the file from storage
    const { error: deleteError } = await supabase.storage
      .from('userfiles')
      .remove([file_path]);

    if (deleteError) {
      console.error('Error deleting file from storage:', deleteError);
      return {
        success: false,
        message: 'Error deleting file from storage'
      };
    }

    // Delete document records (vectors deleted via CASCADE)
    const { error: docDeleteError } = await supabase
      .from('user_documents')
      .delete()
      .eq('user_id', userId)
      .eq('id', file_id)
      .select('id, title');

    if (docDeleteError) {
      console.error('Error deleting document records:', docDeleteError);
      return {
        success: false,
        message: 'Error deleting document metadata'
      };
    }

    revalidatePath('/filer');

    return {
      success: true,
      message: `File deleted successfully`
    };
  } catch (error) {
    console.error('Error during deletion:', error);
    return {
      success: false,
      message: 'Error deleting file'
    };
  }
}

