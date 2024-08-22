'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createServerSupabaseClient as createClient } from '@/lib/server/server';

export async function logFeedback(formData: FormData) {
  const supabase = createClient();

  const feedbackSchema = z.object({
    feedback: z.string(),
    feedbackCategory: z.string(),
    errorMessage: z.string().optional(),
    errorStack: z.string().optional()
  });

  const result = feedbackSchema.safeParse({
    feedback: formData.get('feedback'),
    feedbackCategory: formData.get('feedbackCategory'),
    errorMessage: formData.get('errorMessage'),
    errorStack: formData.get('errorStack')
  });

  if (!result.success) {
    return redirect('/error?message=' + encodeURIComponent('Invalid input'));
  }

  const { feedback, feedbackCategory, errorMessage, errorStack } = result.data;

  try {
    const { error } = await supabase
      .from('error_feedback')
      .insert([
        { feedback, category: feedbackCategory, errorMessage, errorStack }
      ]);

    if (error) throw error;

    revalidatePath('/', 'layout');
    redirect('/');
  } catch (error) {
    console.error('Error logging feedback:', error);
    return redirect(
      '/error?message=' + encodeURIComponent('Internal Server Error')
    );
  }
}
