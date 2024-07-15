import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database'; // Ensure this path matches where you've defined your database types

export function createClient(cookieStore: ReturnType<typeof cookies>) {
  // Create a Supabase client that is typesafe due to <Database> type. Types can be generated directly from Supabase. You can use their CLI
  // or generate them from the Supabase dashboard.
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        }
      }
    }
  );
}
