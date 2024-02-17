import React from 'react';
import Box from '@mui/material/Box';
import { getSession } from '@/lib/client/supabase'; // Import getSession
import { Redis } from '@upstash/redis';
import ChatList from './components/chatlist';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

interface RootLayoutProps {
  children: React.ReactNode;
}

type ChatPreview = {
  id: string;
  firstMessage: string;
  created_at: string;
};

const RootLayout: React.FC<RootLayoutProps> = async ({ children }) => {
  const session = await getSession();
  const userId = session?.id || 'unknown-user';
  let chatPreviews: ChatPreview[] = [];

  try {
    const allChatKeys = await redis.keys(`chat:*-user:${userId}`);

    const previewsPromises = allChatKeys.map(async (key) => {
      const chatId = key.split(':')[1].split('-user')[0];
      const chatMetadata = await redis.hgetall(`chat:${chatId}-user:${userId}`);
      if (!chatMetadata) {
        return null; // Handle null case
      }
      const firstMessage = await redis.lindex(
        `chat:${chatId}-user:${userId}:prompts`,
        0
      );
      return {
        id: chatId,
        firstMessage: firstMessage || 'No messages yet',
        created_at: chatMetadata.created_at || new Date(0).toISOString()
      };
    });

    const fetchedPreviews = await Promise.all(previewsPromises);
    chatPreviews = fetchedPreviews.filter(
      (preview): preview is ChatPreview => preview !== null
    );

    chatPreviews.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (error) {
    console.error('Error fetching chat previews:', error);
  }
  return (
    <Box sx={{ display: 'flex' }}>
      <Box flex={1} p={2} sx={{ overflow: 'auto' }}>
        {' '}
        {children}
      </Box>
      <Box>
        <ChatList userId={userId} chatPreviews={chatPreviews} />
      </Box>
    </Box>
  );
};

export default RootLayout;
