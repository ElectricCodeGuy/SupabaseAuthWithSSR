import React, { use } from 'react';
import Image from 'next/image';
import type { SvgIconProps } from '@mui/material';
import { Box, Typography, Button, Grid2 } from '@mui/material';
import Link from 'next/link';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import CodeIcon from '@mui/icons-material/Code';
import { type User } from '@supabase/supabase-js';
import CloudIcon from '@mui/icons-material/Cloud';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import FrontPageImage from '@/public/images/imageauth.jpg';

interface BannerProps {
  session: Promise<User | null>;
}
interface FeatureProps {
  Icon: React.ComponentType<SvgIconProps>; // Specifies that Icon is a React component that accepts SvgIconProps
  title: string;
  description: string;
}

const Feature: React.FC<FeatureProps> = ({ Icon, title, description }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <Icon color="secondary" />
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
        {title}
      </Typography>
      <Typography variant="body2">{description}</Typography>
    </Box>
  </Box>
);

const BannerComponent: React.FC<BannerProps> = ({ session }) => {
  // use() unwraps the Promise passed from the parent. See: https://react.dev/reference/react/use
  const userSession = use(session);
  const isSessionAvailable = userSession !== null;
  const userEmail = userSession?.email;

  return (
    <Grid2
      container
      spacing={2}
      sx={{
        alignItems: 'center',
        p: 2,
        backgroundColor: '#f5f5f5' // Background color for contrast
      }}
    >
      {/* Image Grid */}
      <Grid2
        size={{
          xs: 12,
          md: 8
        }}
        sx={{
          height: '600px',
          display: {
            xs: 'none', // Hide on small screens
            md: 'block'
          },
          overflow: 'hidden'
        }}
      >
        <Image
          src={FrontPageImage}
          priority
          alt="Background"
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
            borderRadius: '12px'
          }}
        />
      </Grid2>

      <Grid2
        size={{
          xs: 12,
          md: 4
        }}
      >
        <Typography
          variant="h4"
          sx={{ mb: 1, color: 'primary.main', wordWrap: 'break-word' }}
        >
          {isSessionAvailable
            ? `Welcome back, ${userEmail ?? 'User'}!`
            : 'Empower Your Next.js App with Supabase Auth'}
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {isSessionAvailable
            ? 'Dive into the enhanced features and capabilities tailored for your development.'
            : 'Our library seamlessly integrates with Next.js 14, offering server-side rendering support and efficient data fetching with React Server Components.'}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Feature
            Icon={SecurityIcon}
            title="Enhanced Security"
            description="State-of-the-art security for your apps."
          />
          <Feature
            Icon={SpeedIcon}
            title="Blazing Fast"
            description="Optimized for speed, making your apps run smoother."
          />
          <Feature
            Icon={CodeIcon}
            title="Developer Friendly"
            description="Easy to use API and thorough documentation."
          />
          <Feature
            Icon={CloudIcon}
            title="Cloud Integration"
            description="Seamless cloud capabilities with Supabase."
          />
          <Feature
            Icon={IntegrationInstructionsIcon}
            title="Easy Integration"
            description="Simple steps to integrate with your Next.js app."
          />
        </Box>

        <Button
          component={Link}
          href={isSessionAvailable ? '/dashboard' : '#get-started'}
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
        >
          {isSessionAvailable ? 'Explore Dashboard' : 'Get Started Now'}
        </Button>
      </Grid2>
    </Grid2>
  );
};

export default BannerComponent;
