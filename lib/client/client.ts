import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';
// Create a Supabase client for browser-side operations. This can be used to interact with Supabase from the client-side. It is very importatnt
// that you enable RLS on your tables to ensure that your client-side operations are secure. Ideally, you would only enablle Read access on your client-side operations.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
