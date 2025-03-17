import 'server-only';
import { cache } from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { type Database } from '@/types/database';
import { Redis } from '@upstash/redis';
// Define a function to create a Supabase client for server-side operations
// The function takes a cookie store created with next/headers cookies as an argument
// More information can be found on: https://supabase.com/docs/guides/auth/server-side/nextjs?queryGroups=router&router=app

// React Cache: https://react.dev/reference/react/cache
//This memoizes/dedupes the request
// if it is called multiple times in the same request.
export const createServerSupabaseClient = cache(async () => {
  const cookieStore = await cookies();
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error('Missing env variables');
  }
  return createServerClient<Database>(
    // Pass Supabase URL and anonymous key from the environment to the client
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,

    // Define a cookies object with methods for interacting with the cookie store and pass it to the client
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
});

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});
