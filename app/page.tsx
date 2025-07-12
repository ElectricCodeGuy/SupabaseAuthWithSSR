import 'server-only';
import React from 'react';
import { HeroSection } from './components/landingpage/HeroSection';
import { FeaturesSection } from './components/landingpage/FeaturesSection';
import { BentoGrid } from './components/landingpage/BentoGrid';
import { TestimonialsSection } from './components/landingpage/TestimonialsSection';
import { CTASection } from './components/landingpage/CTASection';
import { getSession } from '@/lib/server/supabase';

export default function LandingPage() {
  return (
    <>
      {/* We pass the promise here and resolve it with react.use in the child to prevent the async request from blocking the UI */}
      <HeroSection session={getSession()} />
      <FeaturesSection />
      <BentoGrid />
      <TestimonialsSection />
      <CTASection />
    </>
  );
}
