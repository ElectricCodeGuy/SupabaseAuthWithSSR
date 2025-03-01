import React from 'react';
import SignUpCard from './SignUpCard';
import Content from '../Content';
import ModalWrapper from './ModalWrapper';
import { getSession } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

export default async function SignUpModal() {
  const session = await getSession();

  if (session) {
    return null;
  }

  return (
    <ModalWrapper>
      <div className="flex flex-col md:flex-row justify-center items-center w-full gap-2">
        {/* Left side (Content) - Order changes on mobile */}
        <div
          className="w-full md:w-[45.8%] flex justify-center items-center 
                       pb-8 sm:pb-4 md:pb-0 
                       order-2 md:order-1 
                       rounded-md"
        >
          <Content />
        </div>

        {/* Right side (SignUpCard) - Order changes on mobile */}
        <div
          className="w-full md:w-1/2 
                      pt-8 sm:pt-4 md:pt-0 
                      order-1 md:order-2"
        >
          <SignUpCard />
        </div>
      </div>
    </ModalWrapper>
  );
}
