'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/server/action';

const formDataSchemaSignin = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function login(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const result = formDataSchemaSignin.safeParse({
    email: formData.get('email'),
    password: formData.get('password')
  });

  if (!result.success) {
    redirect('/error?message=' + encodeURIComponent('Invalid Input'));
  }

  const { email, password } = result.data;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirect(
      '/auth?authState=signin&error=' + encodeURIComponent('Login Error')
    );
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

const formDataSchemaSignup = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().optional()
});

export async function signup(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const result = formDataSchemaSignup.safeParse({
    email: formData.get('email') ? String(formData.get('email')) : '',
    password: formData.get('password') ? String(formData.get('password')) : '',
    fullName: formData.get('fullName')
      ? String(formData.get('fullName'))
      : undefined
  });

  if (!result.success) {
    redirect(
      '/auth?authState=signup&error=' + encodeURIComponent('Invalid Input')
    );
  }

  const { email, password, fullName } = result.data;

  const { error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: { full_name: fullName || 'default_user' }
    }
  });
  if (error) {
    redirect(
      '/auth?authState=signup&error=' + encodeURIComponent('Invalid input')
    );
  }

  redirect(
    '/auth?authState=signup&message=' +
      encodeURIComponent('Check your email to confirm your account')
  );
}

const formDataSchemaReset = z.object({
  email: z.string().email()
});

export async function resetPasswordForEmail(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const email = formData.get('email') ? String(formData.get('email')) : '';

  const result = formDataSchemaReset.safeParse({ email: email });

  if (!result.success) {
    redirect(
      '/auth?authState=reset&error=' +
        encodeURIComponent('Failed to send password reset email')
    );
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    redirect(
      '/auth?authState=reset&error=' +
        encodeURIComponent('Failed to send password reset email')
    );
  }

  redirect(
    '/auth?authState=reset&message=' +
      encodeURIComponent(
        'Check your email to continue the password reset process'
      )
  );
}

export async function signout() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const signOutResult = await supabase.auth.signOut();

  if (signOutResult?.error) {
    redirect(
      '/auth?authState=signin?error=' + encodeURIComponent('Logout error')
    );
  } else {
    redirect('/');
  }
}
