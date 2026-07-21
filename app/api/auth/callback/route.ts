import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/server/server';

export const dynamic = 'force-dynamic';

const VALID_OTP_TYPES: EmailOtpType[] = [
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email'
];

function isValidOtpType(value: string): value is EmailOtpType {
  return (VALID_OTP_TYPES as string[]).includes(value);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash_searchParam = searchParams.get('token_hash');
  const code = searchParams.get('code');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/';
  const redirectTo = request.nextUrl.clone();

  const token_hash = code ?? token_hash_searchParam;

  if (token_hash && type && isValidOtpType(type)) {
    const supabase = await createServerSupabaseClient();

    // verifyOtp's `data` is a truthy object even on failure — the error field
    // is the actual success signal.
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash
    });

    if (!error) {
      // `next` is applied as a pathname on a same-origin clone, so it cannot
      // redirect off-site.
      redirectTo.pathname = next;
      redirectTo.searchParams.set(
        'message',
        encodeURIComponent('You can now sign in.')
      );
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
