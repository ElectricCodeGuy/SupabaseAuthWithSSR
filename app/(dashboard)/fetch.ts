import 'server-only';

// Server fetching for the dashboard route-group layout: the sidebar's user
// context and the data for the globally mounted AI-settings modal. Mutations
// go through the ai-settings server actions, which refresh the layout so
// these props update.
import { getSession } from '@/lib/server/supabase';
import { createServerSupabaseClient } from '@/lib/server/server';
import { getSelectedModelId } from './chat/models';
import type { AISettingsData } from './components/ai-settings/types';

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
