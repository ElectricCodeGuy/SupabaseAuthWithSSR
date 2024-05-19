import { createClient } from '@/lib/client/client';

export async function signInWithGoogle() {
  const supabase = createClient();

  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${location.origin}/api/auth/confirm`
    }
  });
}
