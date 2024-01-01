import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type EmailOtpType } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Specifies that this is an Edge Function, for use in an edge runtime environment
//export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Retrieves the token hash from the query parameters
  const token_hash = searchParams.get('token_hash');
  // Retrieves the type of email OTP from the query parameters
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';

  // Checks if both token_hash and type are present
  if (token_hash && type) {
    // Initializes the cookie store to manage cookies
    const cookieStore = cookies();
    // Creates a Supabase client for server-side interactions with cookie management
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value; // Retrieves a cookie by name
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options }); // Sets a cookie
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options }); // Deletes a cookie
          }
        }
      }
    );

    // Attempts to verify the OTP with the provided token hash and type
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash
    });

    // No error means OTP verification was successful
    if (!error) {
      // Redirects to password update page if the type is 'recovery'
      if (type === 'recovery') {
        return NextResponse.redirect(
          new URL(`/redirect/auth-password-update?next=${next}`, request.url)
        );
      }
      // Handle other OTP types as needed
      // Example for 'magiclink':
      // if (type === 'magiclink') { ... }

      // Redirects to a generic transition page for other OTP types
      return NextResponse.redirect(
        new URL(`/redirect/transition?next=${next}&method=otp`, request.url)
      );
    }
  }

  // If there's an error or if token_hash/type are not provided, redirects to an error page
  return NextResponse.redirect(
    new URL('/redirect/auth-code-error', request.url)
  );
}
