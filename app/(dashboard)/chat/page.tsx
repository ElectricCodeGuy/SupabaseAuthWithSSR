import 'server-only';
import ChatComponent from './components/Chat';
import DocumentViewer from './components/PDFViewer';
import WebsiteWiever from './components/WebsiteWiever';
import { randomUUID } from 'node:crypto';
import { getUserInfo } from '@/lib/server/supabase';
import { createClient } from '@/lib/client/client';
import { getChatModelData } from './models';
import { connection } from 'next/server';

interface ChatPageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  await connection();
  const { models, selectedModel } = await getChatModelData();
  const createChatId = randomUUID();
  const { url, pdf } = await searchParams;

  return (
    <div className="flex w-full">
      <div className="flex-1">
        <ChatComponent
          chatId={createChatId}
          initialSelectedOption={selectedModel}
          models={models}
        />
      </div>
      {url ? (
        <WebsiteWiever url={decodeURIComponent(url)} />
      ) : pdf ? (
        <DocumentComponent fileName={decodeURIComponent(pdf)} />
      ) : null}
    </div>
  );
}

async function DocumentComponent({ fileName }: { fileName: string }) {
  const session = await getUserInfo();
  const userId = session?.id;

  let signedUrl = null;

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
