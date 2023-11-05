import { createClient } from '@/lib/server/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const formData = await request.formData();
  const email = String(formData.get('email'));
  const password = String(formData.get('password'));
  const captchaToken = String(formData.get('captchaToken'));

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: { captchaToken }
  });

  if (error) {
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/signin?error=Could not authenticate user`,
      {
        status: 301
      }
    );
  }

  // Always redirect to the transition page with a "method" parameter
  return NextResponse.redirect(
    `${requestUrl.origin}/redirect/transition?method=password`,
    {
      status: 301
    }
  );
}
