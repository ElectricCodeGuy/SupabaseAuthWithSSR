import 'server-only';

import { HeroSection } from '@/app/(frontpage)/landingpage/HeroSection';
import { FeaturesSection } from '@/app/(frontpage)/landingpage/FeaturesSection';
import { BentoGrid } from '@/app/(frontpage)/landingpage/BentoGrid';
import { TestimonialsSection } from '@/app/(frontpage)/landingpage/TestimonialsSection';
import { CTASection } from '@/app/(frontpage)/landingpage/CTASection';
import { getSession } from '@/lib/server/supabase';

export default async function LandingPage() {
  const session = await getSession();
  const isLoggedIn = !!session?.sub;
  return (
    <>
      {/* We pass the promise here and resolve it with react.use in the child to prevent the async request from blocking the UI */}
      <HeroSection session={isLoggedIn} />
      <FeaturesSection />
      <BentoGrid />
      <TestimonialsSection />
      <CTASection />
    </>
  );
}
