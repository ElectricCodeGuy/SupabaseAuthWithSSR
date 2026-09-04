import 'server-only';
import ChatComponent from './components/Chat';
import DocumentViewer from './components/PDFViewer';
import { randomUUID } from 'node:crypto';
import { getChatModelData } from './models';
import { fetchPdfSignedUrl } from './fetch';
import { connection } from 'next/server';

interface ChatPageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  await connection();
  const { models, selectedModel } = await getChatModelData();
  const createChatId = randomUUID();
  const { pdf } = await searchParams;

  return (
    <div className="flex w-full">
      <div className="flex-1">
        <ChatComponent
          chatId={createChatId}
          initialSelectedOption={selectedModel}
          models={models}
        />
      </div>
      {pdf ? (
        <DocumentComponent fileName={decodeURIComponent(pdf)} />
      ) : null}
    </div>
  );
}

async function DocumentComponent({ fileName }: { fileName: string }) {
  const signedUrl = await fetchPdfSignedUrl(fileName);
  return <DocumentViewer fileName={fileName} signedUrl={signedUrl} />;
}
