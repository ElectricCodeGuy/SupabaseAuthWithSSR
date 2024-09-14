import { redis } from '@/lib/server/server';
import { createServerSupabaseClient } from '@/lib/server/server';

export type OpenAiLog = {
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
  if (!chatSessionId) {
    console.warn('Chat session ID is empty. Skipping saving chat to Redis.');
    return;
  }
  const chatKey = `chat:${chatSessionId}-user:${userId}`;
  const promptsKey = `${chatKey}:prompts`;
  const completionsKey = `${chatKey}:completions`;
  const userChatsIndexKey = `userChatsIndex:${userId}`;

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
  const score = isExistingChat
    ? new Date(existingData.created_at).getTime() // Convert existing date to timestamp
    : Date.now();
  try {
    // Use a pipeline to batch Redis operations
    const pipeline = redis.pipeline();

    // Update the chat metadata
    pipeline.hmset(chatKey, chatMetadata);

    // Append the new prompt and completion to their respective lists
    pipeline.rpush(promptsKey, currentMessageContent);
    pipeline.rpush(completionsKey, completion);
    pipeline.zadd(userChatsIndexKey, { score: score, member: chatSessionId });

    // Execute the batched operations
    await pipeline.exec();
  } catch (error) {
    console.error('Error saving chat to Redis:', error);
  }
};

export const saveChatToSupbabase = async (
  chatSessionId: string,
  userId: string,
  currentMessageContent: string,
  completion: string,
  sources?: string[]
): Promise<void> => {
  if (!chatSessionId) {
    console.warn('Chat session ID is empty. Skipping saving chat to Supabase.');
    return;
  }
  const supabase = createServerSupabaseClient();
  try {
    // Upsert the chat session
    const { error: sessionError } = await supabase
      .from('chat_sessions')
      .upsert(
        {
          id: chatSessionId,
          user_id: userId,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      )
      .select();

    if (sessionError) throw sessionError;

    // Prepare messages data
    const messagesData = [
      {
        chat_session_id: chatSessionId,
        is_user_message: true,
        content: currentMessageContent
      },
      {
        chat_session_id: chatSessionId,
        is_user_message: false,
        content: completion,
        sources: sources && sources.length > 0 ? sources : null
      }
    ];

    // Insert both messages in a single query
    const { error: messagesError } = await supabase
      .from('chat_messages')
      .insert(messagesData);

    if (messagesError) throw messagesError;
  } catch (error) {
    console.error('Error saving chat to Supabase:', error);
  }
};
