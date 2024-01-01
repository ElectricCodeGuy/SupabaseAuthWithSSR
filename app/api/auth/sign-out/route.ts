import { createClient } from '@/lib/server/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Specifies that this is an Edge Function, for use in an edge runtime environment
//export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    await supabase.auth.signOut();

    return NextResponse.redirect(`${requestUrl.origin}/`, {
      // a 301 status is required to redirect from a POST to a GET route
      status: 301
    });
  } catch (error) {
    console.error('An error occurred:', error);
    throw error; // rethrow the error to ensure it's handled by any higher-level error handling mechanism
  }
}
