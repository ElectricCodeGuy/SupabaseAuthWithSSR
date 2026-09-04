import 'server-only';

import NavBar from '@/app/components/layout/Navbar/Header';
import Footer from '@/app/components/layout/Footer/Footer';
import { Hero } from '@/app/components/landing/Hero';
import { Features } from '@/app/components/landing/Features';
import { Workspace } from '@/app/components/landing/Workspace';
import { Showcase } from '@/app/components/landing/Showcase';
import { CTA } from '@/app/components/landing/CTA';
import { getSession } from '@/lib/server/supabase';

export default async function LandingPage() {
  const session = await getSession();
  const isLoggedIn = !!session?.sub;
  return (
    <>
      <NavBar />
      <main>
        <Hero session={isLoggedIn} />
        <Features />
        <Workspace />
        <Showcase />
        <CTA session={isLoggedIn} />
      </main>
      <Footer />
    </>
  );
}
