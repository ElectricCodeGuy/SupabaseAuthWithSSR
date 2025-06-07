// app/chat/[chatId]/layout.tsx
import React from 'react';
import { createServerSupabaseClient } from '@/lib/server/server';
import ChatHistoryDrawer from './components/chat_history/ChatHistorySidebar';
import { unstable_noStore as noStore } from 'next/cache';
import { UploadProvider } from './context/uploadContext';
import { isToday, isYesterday, subDays } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import { SidebarProvider } from '@/components/ui/sidebar';

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

// Single combined query
// Single combined query with proper first message fetching
const fetchUserData = async () => {
  noStore();
  const supabase = await createServerSupabaseClient();

  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(
        `
        id,
        full_name,
        email,
        chat_sessions (
          id,
          created_at,
          chat_title,
          first_message:chat_messages!inner(content)
        ),
        user_documents (
          id,
          title,
          created_at,
          total_pages,
          filter_tags
        )
      `
      )
      .order('created_at', {
        ascending: false,
        referencedTable: 'chat_sessions'
      })
      .order('created_at', {
        ascending: false,
        referencedTable: 'user_documents'
      })
      .limit(30, { foreignTable: 'chat_sessions' })
      .limit(1, { foreignTable: 'chat_sessions.chat_messages' })
      .maybeSingle();

    if (userError || !userData) {
      console.error('User Error:', userError);
      return null;
    }

    // Transform chat data using the same logic as the original fetchData function
    const chatPreviews = (userData.chat_sessions || []).map((session) => ({
      id: session.id,
      firstMessage:
        session.chat_title ??
        session.first_message[0]?.content ??
        'No messages yet',
      created_at: session.created_at
    }));

    // Transform documents data
    const documents = (userData.user_documents || []).map((doc) => ({
      id: doc.id,
      title: doc.title,
      created_at: doc.created_at,
      total_pages: doc.total_pages,
      filter_tags: doc.filter_tags
    }));

    return {
      id: userData.id,
      full_name: userData.full_name,
      email: userData.email,
      chatPreviews,
      documents
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};
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

export default async function Layout(props: { children: React.ReactNode }) {
  const userData = await fetchUserData();

  return (
    <SidebarProvider>
      <UploadProvider userId={userData?.id || ''}>
        <ChatHistoryDrawer
          userInfo={{
            id: userData?.id || '',
            full_name: userData?.full_name || '',
            email: userData?.email || ''
          }}
          initialChatPreviews={userData?.chatPreviews || []}
          categorizedChats={categorizeChats(userData?.chatPreviews || [])}
          documents={userData?.documents || []}
        />
        {props.children}
      </UploadProvider>
    </SidebarProvider>
  );
}
