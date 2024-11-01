import 'server-only';
import { getUserInfo } from '@/lib/server/supabase';
import { redirect } from 'next/navigation';
import ChatComponentPage from './component/ChatComponent';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export default async function Page() {
  const userInfo = await getUserInfo();
  if (!userInfo) {
    return redirect('/auth/signin');
  }

  return <ChatComponentPage userInfo={userInfo} />;
}
