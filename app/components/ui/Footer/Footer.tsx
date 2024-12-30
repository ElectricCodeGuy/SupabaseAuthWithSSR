'use client';
import React from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Typography, Box, Grid2, Link as MuiLink } from '@mui/material';
import Link from 'next/link';

export default function Footer() {
  const pathname = usePathname(); // Use the usePathname hook to access the router object
  const currentYear = new Date().getFullYear();

  // If the current pathname is '/aichat', or '/actionchat' do not render the component
  if (pathname.startsWith('/aichat') || pathname.startsWith('/actionchat')) {
    return null;
  }

  return (
    <Box
      component="footer"
      sx={{
        py: 1,
        px: 1,
        mt: 'auto',
        backgroundColor: '#eaeff1', // Updated background color for a fresher look
        color: '#334E68' // Adjusted for better contrast and readability
      }}
    >
      <Grid2
        container
        spacing={5}
        sx={{
          maxWidth: '1200px',
          mx: 'auto',
          justifyContent: 'space-between'
        }}
      >
        <Grid2
          size={{
            xs: 12,
            sm: 6,
            md: 4
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'start',
              gap: 1
            }}
          >
            <Typography variant="h6" color="primary" gutterBottom>
              Supabase SSR Authentication 🛡️
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary'
              }}
            >
              Integrate server-side rendering with Supabase authentication.
              Enhance security and user experience with SSR and Supabase. 🚀
            </Typography>
          </Box>
        </Grid2>

        <Grid2
          size={{
            xs: 12,
            sm: 6,
            md: 4
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}
          >
            <Typography variant="h6" color="primary" gutterBottom>
              Useful Links 🌐
            </Typography>
            {/* Updated links for better accessibility */}
            <MuiLink
              component={Link}
              href="#"
              target="_blank"
              color="secondary"
            >
              Documentation
            </MuiLink>
            <MuiLink
              component={Link}
              href="#"
              target="_blank"
              color="secondary"
            >
              Support
            </MuiLink>
            <MuiLink
              component={Link}
              href="#"
              target="_blank"
              color="secondary"
            >
              Contact
            </MuiLink>
          </Box>
        </Grid2>

        <Grid2
          size={{
            xs: 12,
            md: 4
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'end',
              gap: 2
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
            >
              <Image
                src="/assets/next-js-icon.svg"
                alt="Next.js Logo"
                width={24}
                height={24}
                priority // Use priority prop for faster loading of critical images
              />
              <MuiLink href="https://nextjs.org" target="_blank">
                Next.js
              </MuiLink>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
            >
              <Image
                src="/assets/supabase.svg"
                alt="Supabase Logo"
                width={24}
                height={24}
                priority // Important for critical images
              />
              <MuiLink href="https://supabase.io" target="_blank">
                Supabase
              </MuiLink>
            </Box>
          </Box>
        </Grid2>
      </Grid2>

      <Typography
        variant="body2"
        textAlign="center"
        sx={{
          color: 'text.secondary'
        }}
      >
        Copyright ©{' '}
        <MuiLink color="inherit" href="#" target="_blank">
          Your Company
        </MuiLink>{' '}
        {currentYear}.
      </Typography>
    </Box>
  );
}
