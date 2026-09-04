import { NextResponse } from 'next/server';
import { getSession } from '@/lib/server/supabase';

// Login state for the statically rendered marketing header. Only the fact
// that a valid session cookie exists is reported — never who the user is.
export async function GET() {
  const session = await getSession();
  return NextResponse.json(
    { isLoggedIn: !!session },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
