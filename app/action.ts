'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/server/server';
import {
  emailSchema,
  fullNameSchema,
  passwordSchema
} from '@/lib/validation/auth';

// Auth server actions, shared by the full-page and the modal sign-in /
// sign-up / forgot-password cards. Failure messages are deliberately generic
// so these endpoints can't be used to tell which e-mails have an account.

interface AuthResponse {
  success: boolean;
  message: string;
}

const signInSchema = z.object({
  email: emailSchema,
  // Sign-in only needs *a* password — the policy applies when one is set.
  password: z.string().min(1).max(72)
});

const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: fullNameSchema.optional()
});

const resetSchema = z.object({ email: emailSchema });

function field(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);
  return typeof value === 'string' && value !== '' ? value : undefined;
}

export async function login(formData: FormData): Promise<AuthResponse> {
  const result = signInSchema.safeParse({
    email: field(formData, 'email'),
    password: field(formData, 'password')
  });

  if (!result.success) {
    return { success: false, message: 'Invalid input credentials' };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword(result.data);

  if (error) {
    return { success: false, message: 'Invalid email or password' };
  }

  revalidatePath('/', 'layout');
  return { success: true, message: 'Successfully logged in' };
}

export async function signup(formData: FormData): Promise<AuthResponse> {
  const result = signUpSchema.safeParse({
    email: field(formData, 'email'),
    password: field(formData, 'password'),
    fullName: field(formData, 'fullName')
  });

  if (!result.success) {
    return {
      success: false,
      message: result.error.issues[0]?.message ?? 'Invalid input data'
    };
  }

  const { email, password, fullName } = result.data;
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName ?? 'default_user' }
    }
  });

  if (error) {
    console.error('Sign-up error:', error);
    return { success: false, message: 'Failed to create account' };
  }

  return { success: true, message: 'Check your email to confirm your account' };
}

export async function resetPasswordForEmail(
  formData: FormData
): Promise<AuthResponse> {
  const result = resetSchema.safeParse({ email: field(formData, 'email') });

  if (!result.success) {
    return { success: false, message: 'Invalid email address' };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    result.data.email
  );

  if (error) {
    console.error('Password reset error:', error);
  }

  // Same reply whether or not the address exists.
  return {
    success: true,
    message: 'Check your email to continue the password reset process'
  };
}

// Form action for the marketing-site navbar's sign-out button.
export async function signout(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Sign-out error:', error);
    redirect('/?error=' + encodeURIComponent('Logout error'));
  }
  redirect('/');
}
