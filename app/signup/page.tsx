import 'server-only';

import SignUpCard from './SignUpCard';
import Content from '@/app/components/auth/Content';
import NavBar from '@/app/components/layout/Navbar/Header';
import Footer from '@/app/components/layout/Footer/Footer';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/server/supabase';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: { canonical: '/signup' }
};

export default async function AuthPage() {
  const session = await getSession();
  if (session) {
    redirect('/');
  }

  return (
    <>
      <NavBar />
      <main>
        <div className="flex flex-col justify-between pt-4 h-auto md:h-[calc(100vh-44px)]">
          <div className="flex flex-col-reverse md:flex-row justify-center gap-6 h-full md:h-[calc(100vh-44px)] p-1">
            <Content />
            <SignUpCard />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
