// app/chat/[chatId]/layout.tsx
import React from 'react';
import { Box } from '@mui/material';
import { createServerSupabaseClient } from '@/lib/server/server';
import { getUserInfo } from '@/lib/server/supabase';
import ChatHistoryDrawer from './component/UserChatList';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { unstable_noStore as noStore } from 'next/cache';
import { Tables } from '@/types/database';
import { UploadProvider } from './context/uploadContext';

export const maxDuration = 120;

async function fetchChatPreviews(
  offset: number,
  limit: number,
  supabase: SupabaseClient<Database>
) {
  noStore();
  try {
    const query = supabase
      .from('chat_sessions')
      .select(
        `
        id,
        created_at,
        chat_messages (
          content
        )
      `
      )
      .eq('chat_messages.is_user_message', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
      .order('created_at', {
        referencedTable: 'chat_messages',
        ascending: true
      })
      .limit(1, { foreignTable: 'chat_messages' });

    const { data, error } = await query;

    if (error) throw error;

    // Truncate the content after fetching with null check
    return data.map((chat) => ({
      ...chat,
      chat_messages: chat.chat_messages.map((message) => ({
        content: message.content ? message.content.substring(0, 50) : ''
      }))
    }));
  } catch (error) {
    console.error('Error fetching chat previews:', error);
    return [];
  }
}
type UserInfo = Pick<Tables<'users'>, 'full_name' | 'email' | 'id'>;
type ChatPreview = {
  id: Tables<'chat_sessions'>['id'];
  created_at: Tables<'chat_sessions'>['created_at'];
  chat_messages: {
    content: Tables<'chat_messages'>['content'];
  }[];
};

export default async function Layout(props: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const userData = await getUserInfo();

  let userInfo: UserInfo;
  let initialChatPreviews: ChatPreview[] = [];

  if (userData) {
    userInfo = userData;
    initialChatPreviews = await fetchChatPreviews(0, 25, supabase);
  } else {
    userInfo = {
      id: '',
      full_name: '',
      email: ''
    };
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <UploadProvider>
        <ChatHistoryDrawer
          userInfo={userInfo}
          initialChatPreviews={initialChatPreviews}
        />
        {props.children}
      </UploadProvider>
    </Box>
  );
}
