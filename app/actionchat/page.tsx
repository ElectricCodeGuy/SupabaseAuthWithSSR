import 'server-only';
import { getSession, getUserInfo } from '@/lib/client/supabase';
import { redirect } from 'next/navigation';
import ChatComponentPage from './ChatComponent';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export default async function Page() {
  const session = await getSession();
  if (!session) {
    redirect('/auth');
  }
  const userInfo = await getUserInfo(session.id);

  if (userInfo) {
    const userInfoWithId = {
      id: session.id,
      ...userInfo
    };
    return <ChatComponentPage userInfo={userInfoWithId} />;
  }

  return <ChatComponentPage userInfo={null} />;
}
