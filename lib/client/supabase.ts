import 'server-only';
import { cache } from 'react';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createServerSupabaseClient = () => {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        }
      }
    }
  );

  return supabase;
};
// React Cache: https://react.dev/reference/react/cache
// Caches the session retrieval operation. This helps in minimizing redundant calls
// across server components for the same session data.
async function getSessionUser() {
  const supabase = createServerSupabaseClient();
  try {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

export const getSession = cache(getSessionUser);

// Caches the user information retrieval operation. Similar to getSession,
// this minimizes redundant data fetching across components for the same user data.
export const getUserInfo = cache(async (userId: string) => {
  const supabase = createServerSupabaseClient();
  try {
    const { data } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    return data;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
});
export const findUserDetailsById = async (userId: string) => {
  const supabase = createServerSupabaseClient();
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, filter_tags')
      .eq('id', userId)
      .single();

    return user;
  } catch (error) {
    console.error('Error finding user details:', error);
    return null;
  }
};
