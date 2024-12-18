import 'server-only';
import { Box } from '@mui/system';
import { getUserInfo } from '@/lib/server/supabase';
import ChatComponentPage from './component/ChatComponent';
import { AI as AiProvider } from './action';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export default async function Page() {
  const userInfo = await getUserInfo();

  return (
    <Box
      sx={{
        flex: 1
      }}
    >
      <AiProvider>
        <ChatComponentPage userInfo={userInfo} />{' '}
      </AiProvider>
    </Box>
  );
}
