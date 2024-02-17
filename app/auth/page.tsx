import 'server-only';
import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import AuthFormContent from './AuthForm';
import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/client/supabase';

export default async function AuthPage({
  searchParams
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const session = await getSession();
  if (session) return redirect('/');

  const as = searchParams['as'] || 'signin';

  const isValidAuthState = ['signin', 'signup', 'reset'].includes(as);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <Grid container justifyContent="center">
        <Grid
          item
          xs={12}
          sm={8}
          md={6}
          lg={4}
          xl={3}
          sx={{
            padding: 3,
            borderRadius: 2,
            bgcolor: 'background.paper',
            boxShadow: 1
          }}
        >
          {isValidAuthState ? <AuthFormContent /> : notFound()}
        </Grid>
      </Grid>
    </Box>
  );
}
