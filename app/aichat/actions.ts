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

  const userId = session.id;
  const limit = 30;

  const chatSessionIds = await redis.zrange(
    `userChatsIndex:${userId}`,
    '+inf',
    '-inf',
    {
      byScore: true,
      rev: true,
      offset: offset,
      count: limit
    }
  );

  const previewsPromises = chatSessionIds.map(async (chatSessionId) => {
    const chatMetadata = await redis.hgetall(
      `chat:${chatSessionId}-user:${userId}`
    );
    if (!chatMetadata) {
      return null;
    }
    const firstMessage = await redis.lindex(
      `chat:${chatSessionId}-user:${userId}:prompts`,
      0
    );
    return {
      id: chatSessionId,
      firstMessage: firstMessage || 'No messages yet',
      created_at: chatMetadata.created_at || new Date(0).toISOString()
    };
  });

  const chatPreviews = (await Promise.all(previewsPromises)).filter(
    (preview): preview is ChatPreview => preview !== null
  );

  return chatPreviews;
}
