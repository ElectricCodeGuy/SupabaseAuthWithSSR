'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { redis } from '@/lib/server/server';

const AutoScrollEnabledSchema = z.object({
  autoScrollEnabled: z.boolean()
});

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

const userIdSchema = z.string().min(1, { message: 'UserId cannot be empty' });
const chatIdSchema = z.string().min(1, { message: 'ChatId cannot be empty' });

export async function deleteChatData(userId: string, chatId: string) {
  const userResult = userIdSchema.safeParse(userId);
  const chatResult = chatIdSchema.safeParse(chatId);

  // Check for validation failure
  if (!userResult.success) {
    throw new Error(userResult.error.message);
  }
  if (!chatResult.success) {
    throw new Error(chatResult.error.message);
  }
  const chatKey = `chat:${chatId}-user:${userId}`;
  const userChatsIndexKey = `userChatsIndex:${userId}`; // Key for the ZSET that indexes chats for the user

  try {
    // Start a Redis transaction
    const transaction = redis.multi();

    // Delete chat-related keys from Redis
    transaction.del(chatKey);
    transaction.del(`${chatKey}:prompts`);
    transaction.del(`${chatKey}:completions`);
    transaction.del(`${chatKey}:sources`);

    // Remove the chat session reference from the user's sorted set
    transaction.zrem(userChatsIndexKey, chatId);

    // Execute the transaction
    await transaction.exec();

    // Optionally, trigger revalidation if you're using some form of static generation with ISR
    revalidatePath('/aichat', 'layout');

    return { message: 'Chat data and references deleted successfully' };
  } catch (error) {
    console.error('Error during deletion:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}
