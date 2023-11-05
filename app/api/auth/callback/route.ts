import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Set the runtime to 'edge' for Vercel Edge Functions or Next.js Middleware
export const runtime = 'edge';

export async function GET(request: Request) {
  // Extract the search parameters from the URL of the incoming request
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code'); // Get the OAuth code from the URL
  const next = searchParams.get('next') ?? '/'; // Set the redirect path after auth

  if (code) {
    // Initialize the cookie store
    const cookieStore = cookies();

    // Create a Supabase client for server-side interactions with cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value; // Get a cookie by name
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options }); // Set a cookie
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options }); // Remove a cookie
          }
        }
      }
    );

    // Exchange the OAuth code for a session token
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Redirect to the next page if no error occurred
      return NextResponse.redirect(
        new URL(`/redirect/transition?next=${next}&method=code`, request.url)
      );
    }
  }

  // If an error occurred or no code is present, redirect to an error page
  return NextResponse.redirect(
    new URL('/redirect/auth-code-error', request.url)
  );
}
