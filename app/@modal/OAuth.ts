import { createClient } from '@/lib/client/client';
const supabase = createClient();

export async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${location.origin}/api/auth/confirm`
    }
  });
}
