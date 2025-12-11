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
    return { success: false, message: 'Ikke autoriseret' };
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
        message: 'Fejl ved sletning af fil fra storage'
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
        message: 'Fejl ved sletning af dokument metadata'
      };
    }

    revalidatePath('/filer');

    return {
      success: true,
      message: `Fil slettet succesfuldt`
    };
  } catch (error) {
    console.error('Error during deletion:', error);
    return {
      success: false,
      message: 'Fejl ved sletning af fil'
    };
  }
}

export async function revalidateFiles() {
  revalidatePath('/filer');
}

export async function getDocumentSignedUrl(filePath: string | null) {
  if (!filePath) {
    return { success: false, url: null, message: 'Ingen fil sti' };
  }

  const session = await getSession();
  if (!session) {
    return { success: false, url: null, message: 'Ikke autoriseret' };
  }

  const userId = session.sub;

  // Verify the file belongs to the user
  if (!filePath.startsWith(`${userId}/`)) {
    return { success: false, url: null, message: 'Ikke autoriseret' };
  }

  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.storage
      .from('userfiles')
      .createSignedUrl(filePath, 3600);

    if (error || !data?.signedUrl) {
      console.error('Error creating signed URL:', error);
      return {
        success: false,
        url: null,
        message: 'Kunne ikke hente dokument'
      };
    }

    return { success: true, url: data.signedUrl, message: null };
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return {
      success: false,
      url: null,
      message: 'Fejl ved hentning af dokument'
    };
  }
}
