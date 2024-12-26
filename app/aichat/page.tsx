import 'server-only';
import ChatComponent from './components/chat';
import { getSession } from '@/lib/server/supabase';
import { redirect } from 'next/navigation';
export default async function ChatPage() {
  const session = await getSession();
  if (!session) {
    redirect('/auth/signin');
  }
  return <ChatComponent />;
}
