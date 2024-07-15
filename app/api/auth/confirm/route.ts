import { NextResponse } from 'next/server';
import { createServerSupabaseClient as createClient } from '@/lib/server/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/auth';

  if (code) {
    const supabase = createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const redirectTo = new URL(next, origin);
      redirectTo.searchParams.set(
        'message',
        encodeURIComponent('Du er nu logget ind.') // Add the success message in Danish
      );
      return NextResponse.redirect(redirectTo);
    }
  }

  // If there's an error or no code, redirect to the "/auth" route with an error message
  const redirectTo = new URL('/auth', origin);
  redirectTo.searchParams.set(
    'message',
    encodeURIComponent('Der opstod en fejl under login. Prøv venligst igen.') // Add the error message in Danish
  );
  return NextResponse.redirect(redirectTo);
}
