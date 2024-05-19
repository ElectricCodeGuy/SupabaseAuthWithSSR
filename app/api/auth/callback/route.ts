import { type EmailOtpType } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/server/action';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const cookieStore = cookies();

  const { searchParams } = new URL(request.url);
  const token_hash_searchParam = searchParams.get('token_hash');
  const code = searchParams.get('code'); // New parameter for code
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next');
  const redirectTo = request.nextUrl.clone();

  // Choose code if it's available; otherwise, use token_hash
  const token_hash = code || token_hash_searchParam;

  if (token_hash && type) {
    const supabase = createClient(cookieStore);

    const { data } = await supabase.auth.verifyOtp({
      type,
      token_hash
    });

    if (data) {
      if (next) {
        // If the 'next' parameter exists, redirect to its value
        redirectTo.pathname = next;
      } else {
        redirectTo.pathname = '/auth';
        redirectTo.searchParams.set(
          'message',
          encodeURIComponent('You can now sign in.')
        ); // Add the message in Danish
      }
    } else {
      // OTP verification failed, redirect to error page
      redirectTo.pathname = '/redirect/auth-code-error';
    }
  } else {
    // No valid token or type provided
    redirectTo.pathname = '/redirect/auth-code-error';
  }

  // Ensure to remove query parameters that are no longer needed
  redirectTo.searchParams.delete('token_hash');
  redirectTo.searchParams.delete('code'); // Also remove the code parameter
  redirectTo.searchParams.delete('type');
  redirectTo.searchParams.delete('next'); // Remove the 'next' parameter

  return NextResponse.redirect(redirectTo);
}
