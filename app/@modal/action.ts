'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/server/server';

const formDataSchemaSignin = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function login(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  const result = formDataSchemaSignin.safeParse({
    email: formData.get('email'),
    password: formData.get('password')
  });

  if (!result.success) {
    return {
      success: false,
      message: 'Invalid input credentials'
    };
  }

  const { email, password } = result.data;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return {
      success: false,
      message: 'Invalid email or password'
    };
  }

  revalidatePath('/', 'layout');
  return {
    success: true,
    message: 'Successfully logged in'
  };
}

const formDataSchemaSignup = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().optional()
});

export async function signup(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  const result = formDataSchemaSignup.safeParse({
    email: formData.get('email') ? String(formData.get('email')) : '',
    password: formData.get('password') ? String(formData.get('password')) : '',
    fullName: formData.get('fullName')
      ? String(formData.get('fullName'))
      : undefined
  });

  if (!result.success) {
    return {
      success: false,
      message: 'Invalid input data'
    };
  }

  const { email, password, fullName } = result.data;

  const { error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: { full_name: fullName ?? 'default_user' }
    }
  });

  if (error) {
    console.error('Error:', error);
    return {
      success: false,
      message: 'Failed to create account'
    };
  }

  return {
    success: true,
    message: 'Check your email to confirm your account'
  };
}

const formDataSchemaReset = z.object({
  email: z.string().email()
});

export async function resetPasswordForEmail(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const email = formData.get('email') ? String(formData.get('email')) : '';

  const result = formDataSchemaReset.safeParse({ email: email });

  if (!result.success) {
    return {
      success: false,
      message: 'Invalid email address'
    };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    return {
      success: false,
      message: 'Failed to send password reset email'
    };
  }

  return {
    success: true,
    message: 'Check your email to continue the password reset process'
  };
}

export async function signout() {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return {
      success: false,
      message: 'Failed to sign out'
    };
  }

  return {
    success: true,
    message: 'Successfully signed out'
  };
}
