'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/server/server';

const passwordValidation = z
  .string()
  .min(6, 'Password must be at least 6 characters long')
  .regex(/^(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
  .regex(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
  .regex(/^(?=.*\d)/, 'Password must contain at least one number');

const formDataSchemaResetPassword = z.object({
  newPassword: passwordValidation
});

export async function resetPassword(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  const result = formDataSchemaResetPassword.safeParse({
    newPassword: formData.get('newPassword') ? formData.get('newPassword') : ''
  });

  if (!result.success) {
    // Direct access to error issues - simplest approach
    const errors = result.error.issues;

    let errorMessage = 'Invalid input';

    // Get the first error message (usually the most relevant)
    if (errors.length > 0) {
      errorMessage = errors[0].message;
    }

    // Or if you want to find errors for a specific field:
    const passwordError = errors.find(
      (issue) => issue.path[0] === 'newPassword'
    );
    if (passwordError) {
      errorMessage = passwordError.message;
    }

    redirect(
      '/redirect/auth-password-update?error=' + encodeURIComponent(errorMessage)
    );
  }

  const { newPassword } = result.data;

  const { error } = await supabase.auth.updateUser({
    password: newPassword
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
