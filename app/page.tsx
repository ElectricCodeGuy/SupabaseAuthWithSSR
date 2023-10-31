import React from 'react';
import BannerComponent from './landingpage/Banner';
import Profile from './landingpage/Profile';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import FeatureCard from './landingpage/FeatureCard';

export default async function LandingPage() {
  return (
    <>
      <Box>
        <BannerComponent />
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
