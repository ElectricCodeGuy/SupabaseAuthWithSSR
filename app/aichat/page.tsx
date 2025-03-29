import 'server-only';
import ChatComponent from './components/Chat';
import { cookies } from 'next/headers';
import WebsiteWiever from '../components/ui/shared/WebsiteWiever';
import { v4 as uuidv4 } from 'uuid';

export default async function ChatPage(props: {
  searchParams: Promise<{ url?: string }>;
}) {
  const searchParams = await props.searchParams;
  const cookieStore = await cookies();
  const modelType = cookieStore.get('modelType')?.value ?? 'standart';
  const selectedOption =
    cookieStore.get('selectedOption')?.value ?? 'gpt-3.5-turbo-1106';
  const createChatId = uuidv4();

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
          chatId={createChatId}
          initialModelType={modelType}
          initialSelectedOption={selectedOption}
        />
      </div>
      {searchParams.url ? (
        <WebsiteWiever url={decodeURIComponent(searchParams.url)} />
      ) : null}
    </div>
  );
}
