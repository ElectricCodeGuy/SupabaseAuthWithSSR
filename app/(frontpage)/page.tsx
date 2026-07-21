import 'server-only';

import { Hero } from '@/app/(frontpage)/landingpage/Hero';
import { Features } from '@/app/(frontpage)/landingpage/Features';
import { Showcase } from '@/app/(frontpage)/landingpage/Showcase';
import { CTA } from '@/app/(frontpage)/landingpage/CTA';
import { getSession } from '@/lib/server/supabase';

export default async function LandingPage() {
  const session = await getSession();
  const isLoggedIn = !!session?.sub;
  return (
    <>
      <Hero session={isLoggedIn} />
      <Features />
      <Showcase />
      <CTA session={isLoggedIn} />
    </>
  );
}
