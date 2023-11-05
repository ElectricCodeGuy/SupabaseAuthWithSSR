import { createClient } from '@/lib/client/client';
import type { SupabaseClient } from '@supabase/supabase-js';

// Initialize your Supabase client using the createClient function
const supabase: SupabaseClient = createClient();

type OAuthProvider = 'google' | 'github';

export async function signInWithProvider(
  provider: OAuthProvider
): Promise<void> {
  if (!['google', 'github'].includes(provider)) {
    throw new Error('Invalid OAuth provider specified');
  }

  await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `localhost:3000/api/auth/callback`
    }
  });
}
