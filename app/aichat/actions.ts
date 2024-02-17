'use server';
import { Redis } from '@upstash/redis';
import { revalidatePath } from 'next/cache';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});
export async function fetchChatMessages(
  chatKey: string,
  type: 'prompts' | 'completions'
): Promise<string[]> {
  try {
    return await redis.lrange(`${chatKey}:${type}`, -20, -1);
  } catch (error) {
    console.error(`Error fetching chat ${type} from Redis:`, error);
    return [];
  }
}
type MessageFromDB = {
  id: string;
  prompt: string;
  completion: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchChatMetadata(chatKey: string): Promise<{
  metadata: Omit<MessageFromDB, 'prompt' | 'completion'> | null;
  metadataString: string;
}> {
  try {
    const metadata =
      await redis.hgetall<Omit<MessageFromDB, 'prompt' | 'completion'>>(
        chatKey
      );
    const metadataKey = `${chatKey}:metadata`;
    const metadataString = (await redis.get(metadataKey)) || ''; // Cast as string

    return { metadata, metadataString: metadataString as string }; // Type assertion
  } catch (error) {
    console.error('Error fetching chat metadata from Redis:', error);
    return { metadata: null, metadataString: '' };
  }
}
export async function deleteChatData(userId: string, chatId: string) {
  const chatKey = `chat:${chatId}-user:${userId}`;

  try {
    // Delete chat-related keys from Redis
    await redis.del(chatKey);
    await redis.del(`${chatKey}:prompts`);
    await redis.del(`${chatKey}:completions`);
    revalidatePath('/chatai');
    return { message: 'Filter tag and document chunks deleted successfully' };
  } catch (error) {
    console.error('Error during deletion:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}
