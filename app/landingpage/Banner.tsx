'use client';
import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import type { Session } from '@supabase/supabase-js';

interface BannerProps {
  session: Session | null;
}

const BannerComponent: React.FC<BannerProps> = ({ session }) => {
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        position: 'relative',
        backgroundImage: 'url(https://source.unsplash.com/random?wallpapers)',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[50]
            : theme.palette.grey[900]
      }}
    >
      {/* Conditional header based on session */}
      <Typography
        variant="h3"
        sx={{
          color: 'white',
          textShadow: '2px 2px 8px rgba(0, 0, 0, 0.7)', // Increased shadow for better readability
          zIndex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background for the text
          padding: '10px',
          borderRadius: '10px'
        }}
      >
        {session ? 'You are now signed in!' : 'Supabase SSR Auth Starter'}
      </Typography>

      <Box textAlign="center" color="primary.main" sx={{ mt: 100 }}>
        <Link href="#models" underline="none">
          <Button
            variant="contained"
            color="secondary"
            sx={{ transition: '0.3s', '&:hover': { transform: 'scale(1.05)' } }}
          >
            Discover More
          </Button>
        </Link>
      </Box>
    </Box>
  );
};

export default BannerComponent;
