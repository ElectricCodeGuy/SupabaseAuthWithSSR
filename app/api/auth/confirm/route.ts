import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/server/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/signin';

  if (code) {
    const supabase = await createServerSupabaseClient();

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

  const redirectTo = new URL('/signin', origin);
  redirectTo.searchParams.set(
    'message',
    encodeURIComponent('An error have occoured')
  );
  return NextResponse.redirect(redirectTo);
}
