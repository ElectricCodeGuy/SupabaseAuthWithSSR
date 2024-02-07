import React from 'react';
import BannerComponent from './landingpage/Banner';
import Profile from './landingpage/Profile';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import FeatureCard from './landingpage/FeatureCard';
import { getSession } from '@/lib/client/supabase'; // Import getSession

export const revalidate = 3600; // revalidate the data at most every hour

export default async function LandingPage() {
  const session = await getSession(); // Get session
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
