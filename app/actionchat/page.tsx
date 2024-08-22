import 'server-only';
import { getSession, getUserInfo } from '@/lib/server/supabase';
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
  const userInfoWithId = userInfo ? { id: session.id, ...userInfo } : null;

  return <ChatComponentPage userInfo={userInfoWithId} />;
}
