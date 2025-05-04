import ChatComponent from '../components/Chat';
import { cookies } from 'next/headers';
import WebsiteWiever from '../components/WebsiteWiever';
import DocumentViewer from '../components/PDFViewer';
import UserPdfViewer from '../components/UserPdfFiles';
import { fetchChat, formatMessages } from './fetch';
import { getUserInfo } from '@/lib/server/supabase';

export default async function ChatPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ url?: string; pdf?: string; file?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { id } = params;

  const chatData = await fetchChat(id);

  const cookieStore = await cookies();
  const modelType = cookieStore.get('modelType')?.value ?? 'standart';
  const selectedOption =
    cookieStore.get('selectedOption')?.value ?? 'gpt-3.5-turbo-1106';

  let formattedMessages = undefined;
  let attachmentUrl = undefined;

  if (chatData) {
    formattedMessages = formatMessages(chatData.chat_messages);

    if (searchParams.file && formattedMessages) {
      const fileName = decodeURIComponent(searchParams.file);

      // Scan through all messages to find the attachment
      for (const message of formattedMessages) {
        if (message.experimental_attachments) {
          const attachment = message.experimental_attachments.find(
            (att) => att.name === fileName
          );

          if (attachment) {
            attachmentUrl = attachment.url;
            break;
          }
        }
      }
    }
  }

  return (
    <div className="flex w-full h-[calc(100vh-48px)] overflow-hidden">
      <div className="flex-1">
        <ChatComponent
          currentChat={formattedMessages}
          chatId={id}
          initialModelType={modelType}
          initialSelectedOption={selectedOption}
        />
      </div>
      {attachmentUrl ? (
        <UserPdfViewer
          url={attachmentUrl}
          fileName={
            searchParams.file
              ? decodeURIComponent(searchParams.file)
              : 'Document'
          }
        />
      ) : searchParams.url ? (
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

  return <DocumentViewer fileName={fileName} userId={userId} />;
}
