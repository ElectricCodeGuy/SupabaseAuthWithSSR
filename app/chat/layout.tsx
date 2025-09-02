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
          message_parts:message_parts!chat_session_id (
            text_text,
            type,
            role,
            order
          )
        ),
        user_documents (
          id,
          title,
          created_at,
          total_pages,
          file_path
        )
      `
      )
      .order('created_at', {
        ascending: false,
        referencedTable: 'chat_sessions'
      })
      .order('created_at', {
        ascending: true,
        referencedTable: 'chat_sessions.message_parts'
      })
      .order('order', {
        ascending: true,
        referencedTable: 'chat_sessions.message_parts'
      })
      .order('created_at', {
        ascending: false,
        referencedTable: 'user_documents'
      })
      .limit(30, { foreignTable: 'chat_sessions' })
      .limit(1, { foreignTable: 'chat_sessions.message_parts' })
      .maybeSingle();

    if (userError) {
      return null;
    }
    if (!userData) {
      return null;
    }

    // Transform chat data
    const chatPreviews = (userData.chat_sessions || []).map((session) => {
      // Get the first text part from the first user message
      const firstTextPart = session.message_parts?.find(
        (part) => part.type === 'text' && part.role === 'user'
      );

      return {
        id: session.id,
        firstMessage:
          session.chat_title || firstTextPart?.text_text || 'No messages yet',
        created_at: session.created_at
      };
    });

    // Transform documents data
    const documents = (userData.user_documents || []).map((doc) => ({
      id: doc.id,
      title: doc.title,
      created_at: doc.created_at,
      total_pages: doc.total_pages,
      file_path: doc.file_path
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
      <UploadProvider>
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
