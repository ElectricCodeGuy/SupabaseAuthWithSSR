import ChatComponent from '../components/Chat';
import DocumentViewer from '../components/PDFViewer';
import UserPdfViewer from '../components/UserPdfFiles';
import { fetchChat, formatMessages } from './fetch';
import { fetchPdfSignedUrl } from '../fetch';
import { getSelectableModels, DEFAULT_MODEL_ID } from '../models';
import { connection } from 'next/server';

interface ChatPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pdf?: string; file?: string }>;
}

export default async function ChatPage({
  params,
  searchParams
}: ChatPageProps) {
  await connection();
  const { id } = await params;
  const { pdf, file } = await searchParams;

  const [chatData, models] = await Promise.all([
    fetchChat(id),
    getSelectableModels()
  ]);
  const selectedModel = chatData?.selectedModel ?? DEFAULT_MODEL_ID;

  let formattedMessages = undefined;
  let attachmentUrl = undefined;

  if (chatData) {
    formattedMessages = formatMessages(chatData.message_parts);

    if (file && formattedMessages) {
      const fileName = decodeURIComponent(file);

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
    <div className="flex w-full">
      <div className="flex-1">
        <ChatComponent
          currentChat={formattedMessages}
          chatId={id}
          initialSelectedOption={selectedModel}
          models={models}
        />
      </div>
      {attachmentUrl ? (
        <UserPdfViewer
          url={attachmentUrl}
          fileName={file ? decodeURIComponent(file) : 'Document'}
        />
      ) : pdf ? (
        <DocumentComponent fileName={decodeURIComponent(pdf)} />
      ) : null}
    </div>
  );
}

async function DocumentComponent({ fileName }: { fileName: string }) {
  const signedUrl = await fetchPdfSignedUrl(fileName);
  return <DocumentViewer fileName={fileName} signedUrl={signedUrl} />;
}
