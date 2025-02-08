import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { type Database } from '@/types/database';

/**
 * ⚠️ ADMIN CLIENT - DANGER ZONE ⚠️
 *
 * This client uses the service role key which bypasses Row Level Security (RLS).
 * It has FULL ACCESS to your database without any security restrictions.
 *
 * SECURITY RULES:
 * - NEVER expose this client to the browser/client-side
 * - ONLY use in server-side components/functions
 * - NEVER prefix the service role key with NEXT_PUBLIC_
 * - Keep all admin operations strictly server-side
 *
 * Proper usage:
 * - Server Components
 * - API Routes
 * - Server Actions
 * - Background jobs
 * - Database migrations
 *
 * @returns Supabase Admin Client with service role privileges
 */
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // ⚠️ Never expose this!

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables for server-side operations'
    );
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey);
};
