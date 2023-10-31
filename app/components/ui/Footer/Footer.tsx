/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Image from 'next/image';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="h6" color="text.primary">
                Supabase SSR Authentication 🛡️
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Seamlessly integrate server-side rendering with Supabases robust
              authentication mechanisms. Enhance security, speed, and user
              experience with the power of SSR and Supabase combined. 🚀
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary">
              Useful Links 🌐
            </Typography>
            <Box display="flex" flexDirection="column" gap={0.5}>
              <Typography variant="body2" color="text.secondary">
                <Link href="#" target="_blank">
                  Info
                </Link>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <Link href="#" target="_blank">
                  Info
                </Link>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <Link href="#" target="_blank">
                  Info
                </Link>
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Box
              display="flex"
              flexDirection="row"
              justifyContent="space-between"
            >
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

        <Box>
          <Typography variant="body2" color="text.secondary" align="center">
            {'Copyright © '}
            <Link color="inherit" href="#" target="_blank">
              Your Company
            </Link>{' '}
            {new Date().getFullYear()}
            {'.'}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
