'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/server/supabase';
import { createServerSupabaseClient } from '@/lib/server/server';
import { createAdminClient } from '@/lib/server/admin';

const userIdSchema = z.uuid();

// Every action re-verifies that the CALLER is an admin before touching other
// users' rows with the service-role client — never trust the client side.
async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; message: string }
> {
  const session = await getSession();
  if (!session) return { ok: false, message: 'Not signed in.' };

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', session.sub)
    .maybeSingle();

  if (!data?.is_admin) return { ok: false, message: 'Not authorized.' };
  return { ok: true, userId: session.sub };
}

export async function updateUserName(
  targetUserId: string,
  fullName: string
): Promise<{ success: boolean; message?: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, message: auth.message };

  if (!userIdSchema.safeParse(targetUserId).success) {
    return { success: false, message: 'Invalid user id.' };
  }
  const name = typeof fullName === 'string' ? fullName.trim() : '';
  if (!name || name.length > 200) {
    return { success: false, message: 'Invalid name.' };
  }

  const { error } = await createAdminClient()
    .from('users')
    .update({ full_name: name })
    .eq('id', targetUserId);

  if (error) {
    console.error('updateUserName error:', error);
    return { success: false, message: 'Could not update the name.' };
  }

  revalidatePath('/chat/admin');
  return { success: true };
}

export async function setUserAdmin(
  targetUserId: string,
  isAdmin: boolean
): Promise<{ success: boolean; message?: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, message: auth.message };

  if (
    !userIdSchema.safeParse(targetUserId).success ||
    typeof isAdmin !== 'boolean'
  ) {
    return { success: false, message: 'Invalid input.' };
  }

  // Admins can't demote themselves — prevents locking everyone out.
  if (targetUserId === auth.userId && !isAdmin) {
    return { success: false, message: 'You cannot remove your own admin access.' };
  }

  const { error } = await createAdminClient()
    .from('users')
    .update({ is_admin: isAdmin })
    .eq('id', targetUserId);

  if (error) {
    console.error('setUserAdmin error:', error);
    return { success: false, message: 'Could not update the admin flag.' };
  }

  revalidatePath('/chat/admin');
  return { success: true };
}
