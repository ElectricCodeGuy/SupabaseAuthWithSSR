// app/chat/[chatId]/layout.tsx
import React, { Suspense } from 'react';
import { createServerSupabaseClient } from '@/lib/server/server';
import { unstable_noStore as noStore } from 'next/cache';
import { UploadProvider } from './context/uploadContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import ChatHistoryDrawer from './components/chat_history/ChatHistorySidebar';
import { ChatLayoutSkeleton } from './components/ChatLayoutSkeleton';

export const maxDuration = 60;

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
    const chatPreviews = userData.chat_sessions.map((session) => {
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
    const documents = userData.user_documents.map((doc) => ({
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

export default function Layout({ children }: { children: React.ReactNode }) {
  const userDataPromise = fetchUserData();

  return (
    <SidebarProvider>
      <UploadProvider>
        <Suspense fallback={<ChatLayoutSkeleton />}>
          <ChatHistoryDrawer userDataPromise={userDataPromise} />
        </Suspense>
        {children}
      </UploadProvider>
    </SidebarProvider>
  );
}
