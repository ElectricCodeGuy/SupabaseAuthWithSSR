import 'server-only';
import { Box } from '@mui/material';
import ChatComponent from './components/Chat';
import { cookies } from 'next/headers';
import WebsiteWiever from './components/WebsiteWiever';

export default async function ChatPage(props: {
  searchParams: Promise<{ url?: string }>;
}) {
  const searchParams = await props.searchParams;
  const cookieStore = await cookies();
  const modelType = cookieStore.get('modelType')?.value ?? 'standart';
  const selectedOption =
    cookieStore.get('selectedOption')?.value ?? 'gpt-3.5-turbo-1106';

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ flex: 1 }}>
        <ChatComponent
          initialModelType={modelType}
          initialSelectedOption={selectedOption}
        />
      </Box>
      {searchParams.url ? (
        <WebsiteWiever url={decodeURIComponent(searchParams.url)} />
      ) : null}
    </Box>
  );
}
