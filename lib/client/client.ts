import 'server-only';
import { createBrowserClient } from '@supabase/ssr';
import { type Database } from '@/types/database';

// NOTE: While the Supabase anon key is specifically designed to be exposed publicly
// (it's safe to expose with RLS enabled), I prefer to keep everything server-side
// as an extra security measure. This is why 'server-only' is imported at the top.
// You can always handle everything through SSR anyway, so there's no need to expose
// the client to the browser. All Supabase operations go through server components or API routes/server actions.

export function createClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Missing env variables');
  }
  return createBrowserClient<Database>(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
}
