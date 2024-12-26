// app/chat/[chatId]/layout.tsx
import React from 'react';
import { Box } from '@mui/material';
import { createServerSupabaseClient } from '@/lib/server/server';
import UserCharListDrawer from './components/UserCharListDrawer';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { unstable_noStore as noStore } from 'next/cache';

export const maxDuration = 120;

async function fetchData(
  supabase: SupabaseClient<Database>,
  limit: number = 30,
  offset: number = 0
) {
  noStore();
  try {
    const { data, error } = await supabase
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
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return data.map((session) => ({
      id: session.id,
      firstMessage: session.chat_messages[0]?.content || 'No messages yet',
      created_at: session.created_at
    }));
  } catch (error) {
    console.error('Error fetching chat previews:', error);
    return [];
  }
}

export default async function Layout(props: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();

  const initialChatPreviews = await fetchData(supabase, 30, 0);

  return (
    <Box sx={{ display: 'flex' }}>
      <UserCharListDrawer chatPreviews={initialChatPreviews} />
      {props.children}
    </Box>
  );
}
