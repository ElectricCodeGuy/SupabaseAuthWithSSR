import 'server-only';
import React from 'react';
import BannerComponent from './components/landingpage/Banner';
import Profile from './components/landingpage/Profile';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import FeatureCard from './components/landingpage/FeatureCard';
import { getSession } from '@/lib/server/supabase'; // Import getSession

export default async function LandingPage() {
  const session = await getSession();

  return (
    <>
      <Box>
        <BannerComponent session={session} />
      </Box>
      <Box>
        <FeatureCard />
        <Divider />
      </Box>
      <Box>
        <Profile />
        <Divider />
      </Box>
    </>
  );
}
