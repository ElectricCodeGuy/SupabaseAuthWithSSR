import { createClient } from '@/lib/server/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const formData = await request.formData();
  const email = String(formData.get('email'));
  const password = String(formData.get('password'));
  const captchaToken = String(formData.get('captchaToken')); // Extract the captchaToken from the formData

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${requestUrl.origin}/api/auth/callback`,
      captchaToken // Include the captchaToken in the options
    }
  });

  if (error) {
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/signin?error=Could not authenticate user`,
      {
        // a 301 status is required to redirect from a POST to a GET route
        status: 301
      }
    );
  }

  return NextResponse.redirect(
    `${requestUrl.origin}/auth/signin?message=Check email to continue sign in process`,
    {
      // a 301 status is required to redirect from a POST to a GET route
      status: 301
    }
  );
}
