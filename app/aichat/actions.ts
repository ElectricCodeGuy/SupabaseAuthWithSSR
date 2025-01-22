'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';

import { getSession } from '@/lib/server/supabase';
import { createServerSupabaseClient } from '@/lib/server/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/server/admin';

const AutoScrollEnabledSchema = z.object({
  autoScrollEnabled: z.boolean()
});
//This is not used. But this is how you can store information in the cookies
export async function autoScrollCookie(formData: FormData) {
  const autoScrollEnabledFormData = formData.get('autoScrollEnabled');
  const autoScrollEnabledBoolean =
    autoScrollEnabledFormData === 'true' ? true : false;

  // Use the updated boolean value to validate against the schema
  const result = AutoScrollEnabledSchema.safeParse({
    autoScrollEnabled: autoScrollEnabledBoolean
  });

  if (result.success) {
    (await cookies()).set(
      'autoScrollEnabled',
      result.data.autoScrollEnabled ? 'true' : 'false',
      {
        maxAge: 60 * 60 * 24 * 7, // 1 week
        httpOnly: false,
        secure: false,
        path: '/'
      }
    );
  } else {
    // Log the error if the validation fails
    console.error('Invalid formData for autoScrollEnabled:', result.error);
    // Optionally, throw an error or handle this case as needed
  }
}

export async function deleteChatData(chatId: string) {
  const session = await getSession();
  if (!session) {
    return { message: 'User not authenticated' };
  }
  const supabase = await createServerSupabaseClient();
  try {
    // Delete chat session and associated messages
    const { error: sessionError } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', chatId);

    if (sessionError) throw sessionError;

    return { message: 'Chat data and references deleted successfully' };
  } catch (error) {
    console.error('Error during deletion:', error);
    return { message: 'Error deleting chat data' };
  }
}

export type ChatPreview = {
  id: string;
  firstMessage: string;
  created_at: string;
};

export async function fetchMoreChatPreviews(offset: number) {
  const session = await getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }

  const supabase = await createServerSupabaseClient();
  const limit = 30;

  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select(
        `
        id,
        created_at,
        chat_messages (
          content
        )
      `
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const chatPreviews: ChatPreview[] = data.map((session) => ({
      id: session.id,
      firstMessage: session.chat_messages[0]?.content || 'No messages yet',
      created_at: session.created_at
    }));

    return chatPreviews;
  } catch (error) {
    console.error('Error fetching chat previews:', error);
    return [];
  }
}

const updateChatTitleSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty'),
  chatId: z.string().uuid('Invalid chat ID format')
});

export async function updateChatTitle(formData: FormData) {
  // Create an object from FormData
  const data = {
    title: formData.get('title'),
    chatId: formData.get('chatId')
  };

  // Validate the input
  const result = updateChatTitleSchema.safeParse(data);
  if (!result.success) {
    console.error('Invalid input:', result.error);
    return {
      success: false,
      error: 'Invalid input data'
    };
  }

  // Continue with the validated data
  const { title, chatId } = result.data;

  const userId = await getSession();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const supabaseAdmin = createAdminClient();
  const { error: updateError } = await supabaseAdmin
    .from('chat_sessions')
    .update({ chat_title: title })
    .eq('id', chatId)
    .eq('user_id', userId.id);

  if (updateError) {
    return {
      success: false,
      error: 'Error updating chat title'
    };
  }

  revalidatePath(`/actionchat/[id]`, 'layout');

  return { success: true };
}
