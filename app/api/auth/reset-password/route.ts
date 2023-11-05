import { createClient } from '@/lib/server/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const formData = await request.formData();
  const email = String(formData.get('email'));
  const captchaToken = String(formData.get('captchaToken')); // Extract the captchaToken from formData

  console.log(
    `Email for password reset: ${email}, Captcha Token: ${captchaToken}`
  );

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    captchaToken
  });

  if (error) {
    console.error(`Error during password reset: ${error.message}`);
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/signin?error=Could not send reset email`,
      {
        // a 301 status is required to redirect from a POST to a GET route
        status: 301
      }
    );
  }

  return NextResponse.redirect(
    `${requestUrl.origin}/auth/signin?message=Check email to continue password reset process`,
    {
      // a 301 status is required to redirect from a POST to a GET route
      status: 301
    }
  );
}
