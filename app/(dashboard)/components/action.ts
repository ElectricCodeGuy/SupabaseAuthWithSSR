'use server';
import { createServerSupabaseClient } from '@/lib/server/server';
import { refresh } from 'next/cache';

export async function signOutUser() {
  const supabase = await createServerSupabaseClient();

  await supabase.auth.signOut({ scope: 'local' });
  refresh();
}