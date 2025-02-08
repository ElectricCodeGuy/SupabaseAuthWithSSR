import 'server-only';
import ChatComponent from './components/Chat';
import { cookies } from 'next/headers';

export default async function ChatPage() {
  const cookieStore = await cookies();
  const modelType = cookieStore.get('modelType')?.value || 'standart';
  const selectedOption =
    cookieStore.get('selectedOption')?.value || 'gpt-3.5-turbo-1106';

  return (
    <ChatComponent
      initialModelType={modelType}
      initialSelectedOption={selectedOption}
    />
  );
}
