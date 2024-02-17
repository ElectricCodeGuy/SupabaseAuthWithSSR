import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

type OpenAiLog = {
  id: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};
export const saveChatToRedis = async (
  chatSessionId: string,
  userId: string | null,
  currentMessageContent: string,
  completion: string
): Promise<void> => {
  // Check if the chatSessionId is an empty string and throw an error if true
  if (!chatSessionId.trim()) {
    throw new Error('chatSessionId cannot be empty');
  }

  const chatKey = `chat:${chatSessionId}-user:${userId}`;
  const promptsKey = `${chatKey}:prompts`;
  const completionsKey = `${chatKey}:completions`;

  // Fetch the existing chat metadata
  const existingData = await redis.hgetall<OpenAiLog>(chatKey);

  // Determine if the chat and user IDs match for existing data
  const isExistingChat =
    existingData &&
    existingData.id === chatSessionId &&
    existingData.user_id === userId;

  // Create or update the chat log metadata
  const chatMetadata: OpenAiLog = {
    id: chatSessionId,
    user_id: userId,
    created_at: isExistingChat
      ? existingData!.created_at
      : new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    // Use a pipeline to batch Redis operations
    const pipeline = redis.pipeline();

    // Update the chat metadata
    pipeline.hmset(chatKey, chatMetadata);

    // Append the new prompt and completion to their respective lists
    pipeline.rpush(promptsKey, currentMessageContent);
    pipeline.rpush(completionsKey, completion);

    // Execute the batched operations
    await pipeline.exec();

    console.log('Successfully saved chat to Redis:', chatKey);
  } catch (error) {
    console.error('Error saving chat to Redis:', error);
  }
};
