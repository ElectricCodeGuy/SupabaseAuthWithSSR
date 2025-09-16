import React from 'react';
import SignInCard from './SignInCard';
import Content from '@/app/components/auth/Content';
import ModalWrapper from './ModalWrapper';
import { getSession } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

export default async function SignInModal() {
  const session = await getSession();

  if (session) {
    return null;
  }

  return (
    <ModalWrapper>
      <div className="flex flex-wrap gap-4 justify-center items-center overflow-x-hidden">
        <div className="w-full md:w-5/12 pb-4 sm:pb-2 md:pb-0 flex justify-center items-center order-2 md:order-1 rounded-md">
          <Content />
        </div>
        <div className="w-full md:w-6/12 pt-4 sm:pt-2 md:pt-1 pb-0 sm:pb-0 md:pb-1 order-1 md:order-2">
          <SignInCard />
        </div>
      </div>
    </ModalWrapper>
  );
}
