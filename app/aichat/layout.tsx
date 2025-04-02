// app/chat/[chatId]/layout.tsx
import React from 'react';
import { createServerSupabaseClient } from '@/lib/server/server';
import { getUserInfo } from '@/lib/server/supabase';
import ChatHistoryDrawer from './components/UserCharListDrawer';
import { unstable_noStore as noStore } from 'next/cache';
import type { Tables } from '@/types/database';
import { UploadProvider } from './context/uploadContext';
import { isToday, isYesterday, subDays } from 'date-fns';
import { TZDate } from '@date-fns/tz';

export const maxDuration = 60;

interface ChatPreview {
  id: string;
  firstMessage: string;
  created_at: string;
}

interface CategorizedChats {
  today: ChatPreview[];
  yesterday: ChatPreview[];
  last7Days: ChatPreview[];
  last30Days: ChatPreview[];
  last2Months: ChatPreview[];
  older: ChatPreview[];
}

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

function categorizeChats(chatPreviews: ChatPreview[]): CategorizedChats {
  const getZonedDate = (date: string) =>
    new TZDate(new Date(date), 'Europe/Copenhagen');

  const today = chatPreviews.filter((chat) =>
    isToday(getZonedDate(chat.created_at))
  );

  const yesterday = chatPreviews.filter((chat) =>
    isYesterday(getZonedDate(chat.created_at))
  );

  const last7Days = chatPreviews.filter((chat) => {
    const chatDate = getZonedDate(chat.created_at);
    const sevenDaysAgo = subDays(new Date(), 7);
    return (
      chatDate > sevenDaysAgo && !isToday(chatDate) && !isYesterday(chatDate)
    );
  });

  const last30Days = chatPreviews.filter((chat) => {
    const chatDate = getZonedDate(chat.created_at);
    const thirtyDaysAgo = subDays(new Date(), 30);
    const sevenDaysAgo = subDays(new Date(), 7);
    return chatDate > thirtyDaysAgo && chatDate <= sevenDaysAgo;
  });

  const last2Months = chatPreviews.filter((chat) => {
    const chatDate = getZonedDate(chat.created_at);
    const sixtyDaysAgo = subDays(new Date(), 60);
    const thirtyDaysAgo = subDays(new Date(), 30);
    return chatDate > sixtyDaysAgo && chatDate <= thirtyDaysAgo;
  });

  const older = chatPreviews.filter((chat) => {
    const sixtyDaysAgo = subDays(new Date(), 60);
    return getZonedDate(chat.created_at) <= sixtyDaysAgo;
  });

  return { today, yesterday, last7Days, last30Days, last2Months, older };
}

type UserInfo = Pick<Tables<'users'>, 'full_name' | 'email' | 'id'>;

export default async function Layout(props: { children: React.ReactNode }) {
  const userData = await getUserInfo();

  let userInfo: UserInfo;
  let initialChatPreviews: ChatPreview[] = [];
  let categorizedChats: CategorizedChats = {
    today: [],
    yesterday: [],
    last7Days: [],
    last30Days: [],
    last2Months: [],
    older: []
  };

  if (userData) {
    userInfo = userData;
    initialChatPreviews = await fetchData(30, 0);
    categorizedChats = categorizeChats(initialChatPreviews);
  } else {
    userInfo = {
      id: '',
      full_name: '',
      email: ''
    };
  }

  return (
    <div style={{ display: 'flex' }}>
      <UploadProvider userId={userInfo.id}>
        <ChatHistoryDrawer
          userInfo={userInfo}
          initialChatPreviews={initialChatPreviews}
          categorizedChats={categorizedChats}
        />
        {props.children}
      </UploadProvider>
    </div>
  );
}
