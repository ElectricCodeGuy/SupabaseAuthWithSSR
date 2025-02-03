import 'server-only';
import React from 'react';
import BannerComponent from './components/landingpage/Banner';
import Profile from './components/landingpage/Profile';
import Divider from '@mui/material/Divider';
import FeatureCard from './components/landingpage/FeatureCard';
import Testimonials from './components/landingpage/Testimonials';
import { getSession } from '@/lib/server/supabase';

export default async function LandingPage() {
  const session = await getSession();
  const isSessionAvailable = session !== null;
  const userEmail = session?.email;

  return (
    <>
      <BannerComponent session={isSessionAvailable} userEmail={userEmail} />
      <FeatureCard />
      <Divider />
      <Testimonials />
      <Divider />
      <Profile />
      <Divider />
    </>
  );
}
