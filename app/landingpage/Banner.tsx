'use client';
import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

const BannerComponent = () => {
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
      {/* Catchy header */}
      <Typography
        variant="h3"
        sx={{
          color: 'white',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)', // This adds a shadow to the text for better readability
          zIndex: 1
        }}
      >
        Supabase SSR Auth Starter
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
