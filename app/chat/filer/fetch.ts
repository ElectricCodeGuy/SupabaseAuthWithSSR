import 'server-only';
import { cache } from 'react';
import { createServerSupabaseClient } from '@/lib/server/server';
import { getSession } from '@/lib/server/supabase';
import { decodeBase64, isBase64 } from '@/utils/base64';

export const fetchUserFilesData = cache(async () => {
  const session = await getSession();
  if (!session) return null;

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
    .eq('id', session.sub)
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
// userId/base64EncodedTitle in the private userfiles bucket. The session
// client signs the URL, so storage RLS enforces ownership; the base64 check
// keeps URL input from reaching the storage path at all if it's malformed.
export async function fetchDocumentPreview(encodedTitle: string): Promise<{
  decodedTitle: string | null;
  signedUrl: string | null;
}> {
  const session = await getSession();
  const userId = session?.sub;

  if (!userId || !isBase64(encodedTitle)) {
    return { decodedTitle: null, signedUrl: null };
  }

  const decodedTitle = decodeBase64(encodedTitle);
  let signedUrl: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.storage
      .from('userfiles')
      .createSignedUrl(`${userId}/${encodedTitle}`, 3600);

    if (!error && data) {
      signedUrl = data.signedUrl;
    }
  } catch (error) {
    console.error('Error creating signed URL:', error);
  }

  return { decodedTitle, signedUrl };
}
