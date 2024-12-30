// page.tsx
import React from 'react';
import { type Metadata } from 'next';
import { Box } from '@mui/material';
import { createServerSupabaseClient } from '@/lib/server/server';
import ChatComponentPage from '../component/ChatComponent';
import { getUserInfo, getSession } from '@/lib/server/supabase';
import { notFound } from 'next/navigation';
import { AI as AiProvider } from '../action';
import type { ServerMessage } from '../action';
import DocumentViewer from '../component/PDFViewer';
import { unstable_noStore as noStore } from 'next/cache';

export const maxDuration = 120;

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false
  }
};
async function getChatMessages(chatId: string) {
  noStore();
  const supabase = await createServerSupabaseClient();

  try {
    const { data: chatData, error } = await supabase
      .from('chat_sessions')
      .select(
        `
        user_id,
        chat_messages (
          is_user_message,
          content,
          created_at
        )
      `
      )
      .eq('id', chatId)
      .order('created_at', {
        ascending: true,
        referencedTable: 'chat_messages'
      })
      .single();

    if (error || !chatData) return { messages: [], userId: null };

    return {
      messages: chatData.chat_messages.map(
        (message): ServerMessage => ({
          role: message.is_user_message ? 'user' : ('assistant' as const),
          content: message.content || ''
        })
      ),
      userId: chatData.user_id
    };
  } catch (error) {
    console.error('Error fetching chat data:', error);
    return { messages: [], userId: null };
  }
}
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | '' }>;
}

export default async function Page(props: PageProps) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams
  ]);
  const userInfo = await getUserInfo();

  const { messages, userId } = await getChatMessages(params.id);
  if (userId && userId !== userInfo?.id) {
    notFound();
  }

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ flex: 1 }}>
        <AiProvider initialAIState={messages}>
          <ChatComponentPage userInfo={userInfo} />
        </AiProvider>
      </Box>

      {searchParams.pdf ? (
        <DocumentViewerSuspended
          fileName={decodeURIComponent(searchParams.pdf)}
        />
      ) : null}
    </Box>
  );
}

async function DocumentViewerSuspended({ fileName }: { fileName: string }) {
  const session = await getSession();
  const userId = session?.id;

  const hasActiveSubscription = Boolean(session);

  return (
    <DocumentViewer
      fileName={fileName}
      userId={userId}
      hasActiveSubscription={hasActiveSubscription}
    />
  );
}
