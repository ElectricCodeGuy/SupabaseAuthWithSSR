// app/chat/[chatId]/layout.tsx
import React from 'react';
import { Box } from '@mui/material';
import { createServerSupabaseClient } from '@/lib/server/server';
import ChatHistoryDrawer from './components/UserCharListDrawer';
import { unstable_noStore as noStore } from 'next/cache';
import type { Tables } from '@/types/database';
import { getUserInfo } from '@/lib/server/supabase';

export const maxDuration = 60;

async function fetchData(limit = 30, offset = 0) {
  noStore();
  const supabase = await createServerSupabaseClient();
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select(
        `
          id,
          created_at,
          chat_title,
          first_message:chat_messages!inner(content)
        `
      )
      .order('created_at', { ascending: false })
      .limit(1, { foreignTable: 'chat_messages' })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return data.map((session) => ({
      id: session.id,
      firstMessage:
        session.chat_title ??
        session.first_message[0]?.content ??
        'No messages yet',
      created_at: session.created_at
    }));
  } catch (error) {
    console.error('Error fetching chat previews:', error);
    return [];
  }
}
type UserInfo = Pick<Tables<'users'>, 'full_name' | 'email' | 'id'>;
interface ChatPreview {
  id: string;
  firstMessage: string;
  created_at: string;
}

export default async function Layout(props: { children: React.ReactNode }) {
  const userData = await getUserInfo();

  let userInfo: UserInfo;
  let initialChatPreviews: ChatPreview[] = [];

  if (userData) {
    userInfo = userData;
    initialChatPreviews = await fetchData(30, 0);
  } else {
    userInfo = {
      id: '',
      full_name: '',
      email: ''
    };
  }
  return (
    <Box sx={{ display: 'flex' }}>
      <ChatHistoryDrawer
        userInfo={userInfo}
        initialChatPreviews={initialChatPreviews}
      />
      {props.children}
    </Box>
  );
}
