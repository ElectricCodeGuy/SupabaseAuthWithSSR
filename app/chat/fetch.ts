import 'server-only';

// Server fetching for the chat route: the new-chat page, plus the layout's
// sidebar user context and the data for the globally mounted AI-settings
// modal (the other dashboard layouts import those from here). Model/catalog
// fetching shared with the API route lives in ./models.
import { getSession } from '@/lib/server/supabase';
import { createServerSupabaseClient } from '@/lib/server/server';
import { isBase64 } from '@/utils/base64';
import { getSelectedModelId } from './models';
import type { AISettingsData } from './components/ai-settings/types';

// Signed URL for the PDF opened alongside a chat (?pdf=<base64 title>). The
// session client signs it, so storage RLS enforces that the object is in the
// caller's own folder; the base64 check rejects anything that isn't a
// document key before it touches the storage path.
export async function fetchPdfSignedUrl(
  encodedFileName: string
): Promise<string | null> {
  const session = await getSession();
  if (!session || !isBase64(encodedFileName)) return null;

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.storage
      .from('userfiles')
      .createSignedUrl(`${session.sub}/${encodedFileName}`, 3600); // 1 hour expiry

    if (!error && data) {
      return data.signedUrl;
    }
  } catch (error) {
    console.error('Error creating signed URL:', error);
  }
  return null;
}

// user: null means the visitor is not signed in — the sidebar then renders
// its guest state (blurred example history + sign-in CTAs).
export async function getUserData(): Promise<{
  isAdmin: boolean;
  user: { name: string; email: string; avatar: string } | null;
}> {
  try {
    const session = await getSession();
    if (!session) return { isAdmin: false, user: null };

    const supabase = await createServerSupabaseClient();
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('full_name, email, is_admin')
      .eq('id', session.sub)
      .maybeSingle();

    if (userError) {
      console.error('Error fetching user data:', userError);
      // A session exists — a transient DB error must not flip the sidebar
      // into its guest state. Fall back to the identity from the JWT claims.
      return {
        isAdmin: false,
        user: {
          name:
            (typeof session.email === 'string' &&
              session.email.split('@')[0]) ||
            'User',
          email: typeof session.email === 'string' ? session.email : '',
          avatar: '/avatars/user.jpg'
        }
      };
    }

    const user = {
      name: userData?.full_name || userData?.email?.split('@')[0] || 'User',
      email: userData?.email || '',
      avatar: '/avatars/user.jpg'
    };

    // Admins get the extra Admin section in the sidebar (and /admin access —
    // the page re-checks server-side, the flag here is UI only).
    return {
      isAdmin: !!userData?.is_admin,
      user
    };
  } catch (error) {
    console.error('Error checking user data:', error);
    return { isAdmin: false, user: null };
  }
}

export async function getAISettingsData(): Promise<AISettingsData | null> {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createServerSupabaseClient();
  const [{ data: user }, { data: memories }, { data: models }, selectedModel] =
    await Promise.all([
      supabase
        .from('users')
        .select('full_name, email')
        .eq('id', session.sub)
        .maybeSingle(),
      supabase
        .from('user_memories')
        .select('id, content, created_at')
        .eq('user_id', session.sub)
        .order('created_at', { ascending: false }),
      supabase
        .from('ai_models')
        .select('model_id, display_name, description, cost_note')
        .eq('active', true)
        .eq('selectable', true)
        .order('display_order', { ascending: true }),
      getSelectedModelId()
    ]);

  return {
    fullName: user?.full_name ?? '',
    email: user?.email ?? '',
    selectedModel,
    models: models ?? [],
    memories: memories ?? []
  };
}
