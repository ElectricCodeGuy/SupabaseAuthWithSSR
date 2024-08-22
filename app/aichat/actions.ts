'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { redis } from '@/lib/server/server';
import { getSession } from '@/lib/server/supabase';

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
    cookies().set(
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
  // Check for validation failure
  const session = await getSession();
  if (!session) {
    throw new Error('User session not found');
  }
  const chatKey = `chat:${chatId}-user:${session.id}`;
  const userChatsIndexKey = `userChatsIndex:${session.id}`; // Key for the ZSET that indexes chats for the user

  try {
    // Start a Redis transaction
    const transaction = redis.multi();

    // Delete chat-related keys from Redis
    transaction.del(chatKey);
    transaction.del(`${chatKey}:prompts`);
    transaction.del(`${chatKey}:completions`);

    // Remove the chat session reference from the user's sorted set
    transaction.zrem(userChatsIndexKey, chatId);

    // Execute the transaction
    await transaction.exec();

    // Rerender the list of chats using the 'datafetch' tag
    revalidateTag('datafetch');

    return { message: 'Chat data and references deleted successfully' };
  } catch (error) {
    console.error('Error during deletion:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}
