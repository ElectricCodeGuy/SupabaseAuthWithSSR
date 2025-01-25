import 'server-only';
import { Box } from '@mui/material';
import { getUserInfo } from '@/lib/server/supabase';
import ChatComponentPage from './component/ChatComponent';
import { AI as AiProvider } from './action';
import DocumentViewer from './component/PDFViewer';

export const maxDuration = 60;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | '' }>;
}

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  const userInfo = await getUserInfo();

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ flex: 1 }}>
        <AiProvider>
          <ChatComponentPage userInfo={userInfo} />{' '}
        </AiProvider>
      </Box>

      {searchParams.pdf ? (
        <DocumentComponent fileName={decodeURIComponent(searchParams.pdf)} />
      ) : null}
    </Box>
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
