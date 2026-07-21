import 'server-only';

// Server fetching for the new-chat page. Model/catalog fetching shared with
// the API route lives in ./models — this file covers page-only concerns.
import { getUserInfo } from '@/lib/server/supabase';
import { createAdminClient } from '@/lib/server/admin';

// Signed URL for the PDF opened alongside a fresh chat (?pdf=...). Uses the
// service-role client: signing needs storage access the anon role doesn't
// have, and the path is already scoped to the verified user's folder.
export async function fetchPdfSignedUrl(
  fileName: string
): Promise<string | null> {
  const session = await getUserInfo();
  const userId = session?.id;
  if (!userId) return null;

  try {
    const supabase = createAdminClient();
    const decodedFileName = decodeURIComponent(fileName);
    const filePath = `${userId}/${decodedFileName}`;

    const { data, error } = await supabase.storage
      .from('userfiles')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (!error && data) {
      return data.signedUrl;
    }
  } catch (error) {
    console.error('Error creating signed URL:', error);
  }
  return null;
}
