import { type EmailOtpType } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/server/action';

export async function GET(request: NextRequest) {
  const cookieStore = cookies();

  // Log incoming request details for debugging
  console.log('Request URL:', request.url);

  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';

  console.log('OTP Verification Details:', { token_hash, type });

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.searchParams.delete('token_hash');
  redirectTo.searchParams.delete('type');

  if (token_hash && type) {
    const supabase = createClient(cookieStore);

    // Attempt to verify OTP
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash
    });

    console.log('OTP Verification Response:', { data, error });

    if (!error && data.user) {
      // Insert user into the 'users' table directly after successful OTP verification
      const { error: insertError } = await supabase
        .from('users')
        .insert([{ email: data.user.email, id: data.user.id }])
        .single();

      console.log(
        'User Insertion Response:',
        insertError ? { error: insertError } : 'Success'
      );

      if (insertError) {
        console.error('Error inserting user:', insertError);
        // Redirect to an error page on failure to insert user
        redirectTo.pathname = '/redirect/auth-code-error';
        return NextResponse.redirect(redirectTo);
      }

      // Successfully verified and inserted the user, now redirect
      redirectTo.searchParams.delete('next');
      return NextResponse.redirect(redirectTo);
    }
  } else {
    console.log('Missing token_hash or type for OTP verification.');
  }

  // Redirect to an error page if verification fails or if required parameters are missing
  redirectTo.pathname = '/redirect/auth-code-error';
  return NextResponse.redirect(redirectTo);
}
