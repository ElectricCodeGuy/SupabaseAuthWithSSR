import ChatComponent from '../components/Chat';
import { cookies } from 'next/headers';
import WebsiteWiever from '../components/WebsiteWiever';
import DocumentViewer from '../components/PDFViewer';
import UserPdfViewer from '../components/UserPdfFiles';
import { fetchChat, formatMessages } from './fetch';
import { getUserInfo } from '@/lib/server/supabase';
import { createClient } from '@/lib/client/client';

export default async function ChatPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ url?: string; pdf?: string; file?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { id } = params;

  const chatData = await fetchChat(id);

  const cookieStore = await cookies();

  const selectedOption = cookieStore.get('selectedOption')?.value ?? 'gpt-5';

  let formattedMessages = undefined;
  let attachmentUrl = undefined;

  if (chatData) {
    formattedMessages = formatMessages(chatData.message_parts);

    if (searchParams.file && formattedMessages) {
      const fileName = decodeURIComponent(searchParams.file);

      for (const message of formattedMessages) {
        const filePart = message.parts?.find(
          (part) => part.type === 'file' && part.filename === fileName
        );

        if (filePart && filePart.type === 'file') {
          attachmentUrl = filePart.url;
          break;
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

  let signedUrl: string | null = null;

  if (userId) {
    try {
      const supabase = createClient();
      const decodedFileName = decodeURIComponent(fileName);

      const filePath = `${userId}/${decodedFileName}`;

      const { data, error } = await supabase.storage
        .from('userfiles')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (!error && data) {
        signedUrl = data.signedUrl;
      }
    } catch (error) {
      console.error('Error creating signed URL:', error);
    }
  }

  return <DocumentViewer fileName={fileName} signedUrl={signedUrl} />;
}
