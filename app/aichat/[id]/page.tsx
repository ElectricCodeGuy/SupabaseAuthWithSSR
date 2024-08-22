import 'server-only';
import { Box } from '@mui/material';
import ChatComponent from '../components/chat';
import UserCharListDrawer from '../components/UserCharListDrawer';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/server/supabase';
import { format } from 'date-fns';
import { unstable_cache as cache } from 'next/cache';
import { redis } from '@/lib/server/server';

type MessageFromDB = {
  id: string;
  prompt: string;
  completion: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

type ChatPreview = {
  id: string;
  firstMessage: string;
  created_at: string;
};

async function fetchChat(chatKey: string): Promise<{
  metadata: Omit<MessageFromDB, 'prompt' | 'completion'> | null;
  prompts: string[];
  completions: string[];
}> {
  try {
    const pipeline = redis.pipeline(); // Use a pipeline to batch Redis operations
    pipeline.hgetall(chatKey);
    pipeline.lrange(`${chatKey}:prompts`, 0, -1);
    pipeline.lrange(`${chatKey}:completions`, 0, -1);

    const [metadata, prompts, completions] = await pipeline.exec();

    return {
      metadata: metadata as Omit<MessageFromDB, 'prompt' | 'completion'> | null,
      prompts: prompts as string[],
      completions: completions as string[]
    };
  } catch (error) {
    console.error('Error fetching chat data from Redis:', error);
    return {
      metadata: null,
      prompts: [],
      completions: []
    };
  }
}

const fetchChatPreviews = cache(
  async function fetchData(userId: string): Promise<ChatPreview[]> {
    let chatPreviews: ChatPreview[] = [];
    try {
      const chatSessionIds = await redis.zrange(
        `userChatsIndex:${userId}`,
        '+inf',
        0,
        { byScore: true, rev: true }
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
      chatPreviews = (await Promise.all(previewsPromises)).filter(
        (preview): preview is ChatPreview => preview !== null
      );
    } catch (error) {
      console.error('Error fetching chat previews:', error);
    }
    return chatPreviews;
  },
  ['datafetch'],
  { tags: ['datafetch'], revalidate: 3600 }
);

export default async function ChatPage({ params }: { params: { id: string } }) {
  const session = await getSession();

  if (!session) {
    redirect('/auth');
  }
  let { id } = params;

  const userId = session?.id || 'unknown-user';
  const chatKey = `chat:${id}-user:${userId}`;

  /*
   * The aichat component requires a rewrite configuration in next.config.js
   * to handle the case when no id is provided in the URL. If there is no id,
   * the rewrite rule will redirect to the default '/aichat/1' route.
   *
   * Add the following rewrite configuration in next.config.js:
   *
   * module.exports = {
   *   async rewrites() {
   *     return [
   *       {
   *         source: '/aichat',
   *         destination: '/aichat/1'
   *       }
   *     ];
   *   }
   * };
   */

  id = id === '1' ? '' : id;

  /*
   * We check the chatId for being 1 since this is just a default value,
   * that we do not want to pass down to the children.
   * This is NOT recommended for production. It is only for demonstration purposes.
   * You would have to create a page.tsx inside the /aichat folder that is the default url for /aichat
   */

  const [chatPreviews, chatDataResult] = await Promise.all([
    fetchChatPreviews(userId),
    chatKey ? fetchChat(chatKey) : Promise.resolve(null)
  ]);

  const chatData =
    id !== '1' && chatDataResult
      ? {
          id: id!,
          prompt: chatDataResult.prompts,
          completion: chatDataResult.completions,
          created_at: chatDataResult.metadata?.created_at
            ? format(
                new Date(chatDataResult.metadata.created_at),
                'dd-MM-yyyy HH:mm'
              )
            : '',
          updated_at: chatDataResult.metadata?.updated_at
            ? format(
                new Date(chatDataResult.metadata.updated_at),
                'dd-MM-yyyy HH:mm'
              )
            : ''
        }
      : {
          id: '',
          prompt: [],
          completion: [],
          created_at: '',
          updated_at: ''
        };

  return (
    <Box
      sx={{
        display: 'flex',
        overflow: 'hidden',
        maxHeight: '100vh',
        pt: {
          xs: 4,
          sm: 4,
          md: 0
        }
      }}
    >
      <ChatComponent currentChat={chatData} chatId={id} />
      <UserCharListDrawer chatPreviews={chatPreviews} chatId={id} />
    </Box>
  );
}
