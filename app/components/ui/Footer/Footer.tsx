/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Image from 'next/image';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: '#f7f7f7' // Adjust the background color
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          <Grid item xs={12} sm={6} md={4}>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="start"
              gap={1}
            >
              <Typography variant="h6" color="primary">
                Supabase SSR Authentication 🛡️
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Seamlessly integrate server-side rendering with Supabase&apos;s
                robust authentication mechanisms. Enhance security, speed, and
                user experience with the power of SSR and Supabase combined. 🚀
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Box display="flex" flexDirection="column" gap={1}>
              <Typography variant="h6" color="primary">
                Useful Links 🌐
              </Typography>
              {/* Example links */}
              <Link href="#" target="_blank" color="secondary">
                Documentation
              </Link>
              <Link href="#" target="_blank" color="secondary">
                Support
              </Link>
              <Link href="#" target="_blank" color="secondary">
                Contact
              </Link>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box display="flex" flexDirection="column" alignItems="end" gap={1}>
              <Box display="flex" alignItems="center" gap={2}>
                <Image
                  src="/assets/next-js-icon.svg"
                  alt="Next.js Logo"
                  width={24}
                  height={24}
                />
                <Link href="https://nextjs.org" target="_blank">
                  Next.js
                </Link>
              </Box>
              <Box display="flex" alignItems="center" gap={2}>
                <Image
                  src="/assets/supabase.svg"
                  alt="Supabase Logo"
                  width={24}
                  height={24}
                />
                <Link href="https://supabase.io" target="_blank">
                  Supabase
                </Link>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Box mt={3} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Copyright ©{' '}
            <Link color="inherit" href="#" target="_blank">
              Your Company
            </Link>{' '}
            {currentYear}.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
