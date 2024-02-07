/* eslint-disable jsx-a11y/anchor-is-valid */
'use client';
import React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Image from 'next/image';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname(); // Use the useRouter hook to access the router object
  const currentYear = new Date().getFullYear();

  // If the current pathname is '/aichat', do not render the component
  if (pathname === '/aichat') {
    return null;
  }

  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        px: 1,
        mt: 'auto',
        backgroundColor: '#eaeff1', // Updated background color for a fresher look
        color: '#334E68' // Adjusted for better contrast and readability
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={5} justifyContent="space-between">
          <Grid item xs={12} sm={6} md={4}>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="start"
              gap={1}
            >
              <Typography variant="h6" color="primary" gutterBottom>
                Supabase SSR Authentication 🛡️
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Integrate server-side rendering with Supabase authentication.
                Enhance security and user experience with SSR and Supabase. 🚀
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Box display="flex" flexDirection="column" gap={1}>
              <Typography variant="h6" color="primary" gutterBottom>
                Useful Links 🌐
              </Typography>
              {/* Updated links for better accessibility */}
              <Link
                href="#"
                target="_blank"
                color="secondary"
                underline="hover"
              >
                Documentation
              </Link>
              <Link
                href="#"
                target="_blank"
                color="secondary"
                underline="hover"
              >
                Support
              </Link>
              <Link
                href="#"
                target="_blank"
                color="secondary"
                underline="hover"
              >
                Contact
              </Link>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box display="flex" flexDirection="column" alignItems="end" gap={2}>
              <Box display="flex" alignItems="center" gap={2}>
                <Image
                  src="/assets/next-js-icon.svg"
                  alt="Next.js Logo"
                  width={24}
                  height={24}
                  priority // Use priority prop for faster loading of critical images
                />
                <Link
                  href="https://nextjs.org"
                  target="_blank"
                  underline="hover"
                >
                  Next.js
                </Link>
              </Box>
              <Box display="flex" alignItems="center" gap={2}>
                <Image
                  src="/assets/supabase.svg"
                  alt="Supabase Logo"
                  width={24}
                  height={24}
                  priority // Important for critical images
                />
                <Link
                  href="https://supabase.io"
                  target="_blank"
                  underline="hover"
                >
                  Supabase
                </Link>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Box textAlign="center">
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Copyright ©{' '}
            <Link color="inherit" href="#" target="_blank" underline="hover">
              Your Company
            </Link>{' '}
            {currentYear}.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
