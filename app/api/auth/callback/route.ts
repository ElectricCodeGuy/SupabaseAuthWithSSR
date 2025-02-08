import { type EmailOtpType } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/server/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash_searchParam = searchParams.get('token_hash');
  const code = searchParams.get('code');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';
  const redirectTo = request.nextUrl.clone();

  const token_hash = code ?? token_hash_searchParam;

  if (token_hash && type) {
    const supabase = await createServerSupabaseClient();

    const { data } = await supabase.auth.verifyOtp({
      type,
      token_hash
    });

    if (data) {
      if (next) {
        redirectTo.pathname = next;
        redirectTo.searchParams.set(
          'message',
          encodeURIComponent('You can now sign in.')
        );
      } else {
        redirectTo.pathname = '/signin';
        redirectTo.searchParams.set(
          'message',
          encodeURIComponent('You can now sign in.')
        );
      }
    } else {
      // Instead of redirecting to error page, go to root with error message
      redirectTo.pathname = '/';
      redirectTo.searchParams.set(
        'error',
        encodeURIComponent('Authentication failed. Please try again.')
      );
    }
  } else {
    // No valid token or type, go to root with error message
    redirectTo.pathname = '/';
    redirectTo.searchParams.set(
      'error',
      encodeURIComponent('Invalid authentication attempt. Please try again.')
    );
  }

  // Clean up unnecessary parameters
  redirectTo.searchParams.delete('token_hash');
  redirectTo.searchParams.delete('code');
  redirectTo.searchParams.delete('type');
  redirectTo.searchParams.delete('next');

  return NextResponse.redirect(redirectTo);
}
