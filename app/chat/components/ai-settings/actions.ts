'use server';

// Server actions for the AI settings modal. Each takes ONLY the FormData —
// the useActionState (prev, formData) adapter lives client-side in the
// modal. Inputs are zod-validated; every mutation calls refresh() so the
// client router re-renders the dashboard layout with fresh server props.
import { refresh } from 'next/cache';
import { z } from 'zod';
import { getSession } from '@/lib/server/supabase';
import { createServerSupabaseClient } from '@/lib/server/server';
import type { SettingsActionState } from './types';

const modelSchema = z.object({
  modelId: z.string().min(1).max(100)
});

const nameSchema = z.object({
  fullName: z.string().trim().min(1).max(200)
});

const memoryContentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Memory cannot be empty.')
    .max(500, 'Memories are limited to 500 characters.')
});

const memoryIdSchema = z.object({
  memoryId: z.uuid()
});

const memoryUpdateSchema = z.object({
  memoryId: z.uuid(),
  content: z
    .string()
    .trim()
    .min(1, 'Memory cannot be empty.')
    .max(500, 'Memories are limited to 500 characters.')
});

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid input.';
}

export async function setDefaultModelAction(
  formData: FormData
): Promise<SettingsActionState> {
  const session = await getSession();
  if (!session) return { success: false, message: 'Not signed in.' };

  const parsed = modelSchema.safeParse({ modelId: formData.get('modelId') });
  if (!parsed.success) {
    return { success: false, message: firstIssue(parsed.error) };
  }

  const supabase = await createServerSupabaseClient();

  // Only active, selectable models may be chosen.
  const { data: model } = await supabase
    .from('ai_models')
    .select('model_id')
    .eq('model_id', parsed.data.modelId)
    .eq('active', true)
    .eq('selectable', true)
    .maybeSingle();
  if (!model) return { success: false, message: 'Unknown model.' };

  const { error } = await supabase
    .from('users')
    .update({ selected_model: parsed.data.modelId })
    .eq('id', session.sub);
  if (error) return { success: false, message: 'Could not update the model.' };

  refresh();
  return { success: true, message: 'Default model updated.' };
}

export async function updateDisplayNameAction(
  formData: FormData
): Promise<SettingsActionState> {
  const session = await getSession();
  if (!session) return { success: false, message: 'Not signed in.' };

  const parsed = nameSchema.safeParse({ fullName: formData.get('fullName') });
  if (!parsed.success) {
    return { success: false, message: firstIssue(parsed.error) };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('users')
    .update({ full_name: parsed.data.fullName })
    .eq('id', session.sub);
  if (error) return { success: false, message: 'Could not update the name.' };

  refresh();
  return { success: true, message: 'Name updated.' };
}

export async function addMemoryAction(
  formData: FormData
): Promise<SettingsActionState> {
  const session = await getSession();
  if (!session) return { success: false, message: 'Not signed in.' };

  const parsed = memoryContentSchema.safeParse({
    content: formData.get('content')
  });
  if (!parsed.success) {
    return { success: false, message: firstIssue(parsed.error) };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('user_memories')
    .insert({ user_id: session.sub, content: parsed.data.content });
  if (error) return { success: false, message: 'Could not save the memory.' };

  refresh();
  return { success: true, message: 'Memory added.' };
}

export async function updateMemoryAction(
  formData: FormData
): Promise<SettingsActionState> {
  const session = await getSession();
  if (!session) return { success: false, message: 'Not signed in.' };

  const parsed = memoryUpdateSchema.safeParse({
    memoryId: formData.get('memoryId'),
    content: formData.get('content')
  });
  if (!parsed.success) {
    return { success: false, message: firstIssue(parsed.error) };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('user_memories')
    .update({ content: parsed.data.content })
    .eq('id', parsed.data.memoryId)
    .eq('user_id', session.sub);
  if (error) return { success: false, message: 'Could not update the memory.' };

  refresh();
  return { success: true, message: 'Memory updated.' };
}

export async function deleteMemoryAction(
  formData: FormData
): Promise<SettingsActionState> {
  const session = await getSession();
  if (!session) return { success: false, message: 'Not signed in.' };

  const parsed = memoryIdSchema.safeParse({
    memoryId: formData.get('memoryId')
  });
  if (!parsed.success) {
    return { success: false, message: firstIssue(parsed.error) };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('user_memories')
    .delete()
    .eq('id', parsed.data.memoryId)
    .eq('user_id', session.sub);
  if (error) return { success: false, message: 'Could not delete the memory.' };

  refresh();
  return { success: true, message: 'Memory deleted.' };
}
