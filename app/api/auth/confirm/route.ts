import { NextResponse } from 'next/server';
import { createServerSupabaseClient as createClient } from '@/lib/server/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/auth/signin';

  if (code) {
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const redirectTo = new URL(next, origin);
      redirectTo.searchParams.set(
        'message',
        encodeURIComponent('You are now signed in')
      );
      return NextResponse.redirect(redirectTo);
    }
  }

  // If there's an error or no code, redirect to the "/auth" route with an error message
  const redirectTo = new URL('/auth/signin', origin);
  redirectTo.searchParams.set(
    'message',
    encodeURIComponent('An error have occoured')
  );
  return NextResponse.redirect(redirectTo);
}
