import 'server-only';
import { getUserInfo } from '@/lib/server/supabase';
import ChatComponentPage from './component/ChatComponent';
import { AI as AiProvider } from './action_chat/AIProvider';
import DocumentViewer from './component/PDFViewer';
import WebsiteWiever from '../components/ui/shared/WebsiteWiever';

export const maxDuration = 60;

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  const userInfo = await getUserInfo();

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        overflow: 'hidden'
      }}
    >
      <div style={{ flex: 1 }}>
        <AiProvider>
          <ChatComponentPage userInfo={userInfo} />{' '}
        </AiProvider>
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
