'use server';

import { z } from 'zod';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/server/action';

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
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const result = formDataSchemaResetPassword.safeParse({
    newPassword: formData.get('newPassword')
      ? String(formData.get('newPassword'))
      : ''
  });

  if (!result.success) {
    const fieldErrors = result.error.formErrors.fieldErrors;
    let errorMessage = 'Invalid input';
    if (fieldErrors.newPassword) {
      const passwordErrors = fieldErrors.newPassword;
      if (Array.isArray(passwordErrors)) {
        errorMessage = passwordErrors[0];
      } else {
        errorMessage = passwordErrors;
      }
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
    '/auth/signin?message=' +
      encodeURIComponent('Your password has been updated')
  );
}
