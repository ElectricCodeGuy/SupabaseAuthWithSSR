import 'server-only';

import SignInCard from './SignInCard';
import Content from '@/app/(frontpage)/components/auth/Content';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/server/supabase';

export default async function AuthPage() {
  const session = await getSession();
  if (session) {
    redirect('/');
  }

  return (
    <div className="flex flex-col justify-between pt-4 h-auto md:h-[calc(100vh-44px)]">
      <div className="flex flex-col-reverse md:flex-row justify-center gap-12 h-full md:h-[calc(100vh-44px)] p-1">
        <Content />
        <SignInCard />
      </div>
    </div>
  );
}
