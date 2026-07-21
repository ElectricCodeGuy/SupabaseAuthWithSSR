import { cache } from 'react';
import { createServerSupabaseClient } from '@/lib/server/server';
import { createAdminClient } from '@/lib/server/admin';
import { getSession } from '@/lib/server/supabase';
import { decodeBase64 } from '@/utils/base64';

export const fetchUserFilesData = cache(async () => {
  const supabase = await createServerSupabaseClient();

  const { data: userData, error } = await supabase
    .from('users')
    .select(
      `
      id,
      user_documents (
        id,
        title,
        created_at,
        total_pages,
        file_path
      )
    `
    )
    .order('created_at', {
      referencedTable: 'user_documents',
      ascending: false
    })
    .maybeSingle();

  if (error || !userData) {
    return null;
  }

  return {
    userId: userData.id,
    userDocuments: userData.user_documents || []
  };
});

// Signed URL for the selected document preview. Files are stored as
// userId/base64EncodedTitle in the private userfiles bucket.
export async function fetchDocumentPreview(encodedTitle: string): Promise<{
  decodedTitle: string | null;
  signedUrl: string | null;
}> {
  const session = await getSession();
  const userId = session?.sub;

  let signedUrl: string | null = null;
  let decodedTitle: string | null = null;

  if (userId && encodedTitle) {
    try {
      const supabase = createAdminClient();
      const filePath = `${userId}/${encodedTitle}`;
      decodedTitle = decodeBase64(encodedTitle);

      const { data, error } = await supabase.storage
        .from('userfiles')
        .createSignedUrl(filePath, 3600);

      if (!error && data) {
        signedUrl = data.signedUrl;
      }
    } catch (error) {
      console.error('Error creating signed URL:', error);
    }
  }

  return { decodedTitle, signedUrl };
}
