'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/server/server';
import { passwordSchema } from '@/lib/validation/auth';

const formDataSchemaResetPassword = z.object({
  newPassword: passwordSchema
});

export async function resetPassword(formData: FormData) {
  const result = formDataSchemaResetPassword.safeParse({
    newPassword: formData.get('newPassword') ?? ''
  });

  if (!result.success) {
    const errorMessage = result.error.issues[0]?.message ?? 'Invalid input';
    redirect(
      '/redirect/auth-password-update?error=' + encodeURIComponent(errorMessage)
    );
  }

  // updateUser only works for the session established by the recovery
  // link — with no session Supabase rejects it, which lands in the error
  // branch below.
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({
    password: result.data.newPassword
  });

  if (error) {
    redirect(
      '/redirect/auth-password-update?error=' +
        encodeURIComponent('An error occurred while updating the password')
    );
  }

  redirect(
    '/signin?message=' + encodeURIComponent('Your password has been updated')
  );
}
