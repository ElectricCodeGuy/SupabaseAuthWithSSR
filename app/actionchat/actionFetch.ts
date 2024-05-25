'use server';
import { redis } from '@/lib/server/server';
import { z } from 'zod';

const userIdSchemaChat = z.string().uuid();

type ChatPreview = {
  id: string;
  firstMessage: string;
  created_at: string;
};

export async function fetchChatPreviews(
  userId: string
): Promise<ChatPreview[]> {
  let chatPreviews: ChatPreview[] = [];

  try {
    const parseResult = userIdSchemaChat.safeParse(userId);
    if (!parseResult.success) {
      console.error('Invalid userId:', parseResult.error);
      return chatPreviews;
    }

    const validUserId = parseResult.data;

    const chatSessionIds = await redis.zrange(
      `userChatsIndex:${validUserId}`,
      '+inf',
      0,
      { byScore: true, rev: true }
    );

    const pipeline = redis.pipeline();

    chatSessionIds.forEach((chatSessionId) => {
      pipeline.hgetall(`chat:${chatSessionId}-user:${userId}`);
      pipeline.lindex(`chat:${chatSessionId}-user:${userId}:prompts`, 0);
    });

    const pipelineResults = await pipeline.exec();

    chatPreviews = pipelineResults.reduce(
      (acc: ChatPreview[], result, index) => {
        if (index % 2 === 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const chatMetadata = result as any;
          const firstMessage = pipelineResults[index + 1] as string;

          if (chatMetadata) {
            acc.push({
              id: chatSessionIds[index / 2] as string,
              firstMessage: firstMessage || 'No messages yet',
              created_at: chatMetadata.created_at || new Date(0).toISOString()
            });
          }
        }
        return acc;
      },
      []
    );
  } catch (error) {
    console.error('Error fetching chat previews:', error);
  }

  return chatPreviews;
}
const userIdSchema = z
  .string()
  .uuid({ message: 'UUID is Wrong for some reason?????' });

export async function deleteChatData(userId: string, chatId: string) {
  const userResult = userIdSchema.safeParse(userId);

  // Check for validation failure
  if (!userResult.success) {
    throw new Error(userResult.error.message);
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

    return { message: 'Chat data and references deleted successfully' };
  } catch (error) {
    console.error('Error during deletion:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}
