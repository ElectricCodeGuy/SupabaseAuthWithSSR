import 'server-only';
import React from 'react';
import BannerComponent from './components/landingpage/Banner';
import Profile from './components/landingpage/Profile';
import { Separator } from '@/components/ui/separator';
import FeatureCard from './components/landingpage/FeatureCard';
import Testimonials from './components/landingpage/Testimonials';
import { getSession } from '@/lib/server/supabase';

export default function LandingPage() {
  return (
    <>
      {/* We pass the promise here and resolve it with react.use in the child to prevent the async request from blocking the UI */}
      <BannerComponent session={getSession()} />
      <FeatureCard />
      <Separator />
      <Testimonials />
      <Separator />
      <Profile />
      <Separator />
    </>
  );
}
