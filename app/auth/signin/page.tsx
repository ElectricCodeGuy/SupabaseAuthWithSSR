import 'server-only';
import React from 'react';
import { Stack } from '@mui/material';
import SignInCard from './SignInCard';
import Content from '../Content';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/server/supabase';

export default async function AuthPage() {
  const session = await getSession();
  if (session) {
    redirect('/');
  }

  return (
    <Stack
      direction="column"
      sx={{
        justifyContent: 'space-between',
        pt: 4,
        height: { xs: 'auto', md: '100vh' }
      }}
    >
      <Stack
        direction={{ xs: 'column-reverse', md: 'row' }}
        sx={{
          justifyContent: 'center',
          gap: { xs: 6, sm: 6 },
          height: { xs: '100%', md: '100vh' },
          p: 1
        }}
      >
        <Content />
        <SignInCard />
      </Stack>
    </Stack>
  );
}
