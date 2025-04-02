import ChatComponent from '../components/Chat';
import { format } from 'date-fns';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import WebsiteWiever from '../../components/ui/shared/WebsiteWiever';
import DocumentViewer from '../components/PDFViewer';
import { fetchChat, formatMessages } from './fetch';
import { getUserInfo } from '@/lib/server/supabase';

export default async function ChatPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ url?: string; pdf?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { id } = params;

  const chatData = await fetchChat(id);

  if (!chatData) {
    redirect('/aichat');
  }

  const cookieStore = await cookies();
  const modelType = cookieStore.get('modelType')?.value ?? 'standart';
  const selectedOption =
    cookieStore.get('selectedOption')?.value ?? 'gpt-3.5-turbo-1106';

  const formattedMessages = formatMessages(chatData.chat_messages);

  const formattedChatData = {
    id: chatData.id,
    user_id: chatData.user_id,
    prompt: formattedMessages
      .filter((m) => m.role === 'user')
      .map((m) => m.content),
    completion: formattedMessages
      .filter((m) => m.role === 'assistant')
      .map((m) => m.content),
    created_at: format(new Date(chatData.created_at), 'dd-MM-yyyy HH:mm'),
    updated_at: format(new Date(chatData.updated_at), 'dd-MM-yyyy HH:mm'),
    chat_messages: formattedMessages
  };

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        overflow: 'hidden'
      }}
    >
      <div style={{ flex: 1 }}>
        <ChatComponent
          currentChat={formattedChatData}
          chatId={id}
          initialModelType={modelType}
          initialSelectedOption={selectedOption}
        />
      </div>
      {searchParams.url ? (
        <WebsiteWiever url={decodeURIComponent(searchParams.url)} />
      ) : searchParams.pdf ? (
        <DocumentComponent fileName={decodeURIComponent(searchParams.pdf)} />
      ) : null}
    </div>
  );
}

async function DocumentComponent({ fileName }: { fileName: string }) {
  const session = await getUserInfo();
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
