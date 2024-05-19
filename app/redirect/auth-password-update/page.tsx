import 'server-only';
import React from 'react';
import { Stack } from '@mui/material';
import { getSession } from '@/lib/client/supabase';
import { redirect } from 'next/navigation';
import PasswordUpdateForm from './PasswordUpdateForm';

export default async function PasswordUpdatePage() {
  const session = await getSession();

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <Stack
      direction="column"
      justifyContent="space-between"
      sx={{
        pt: 4,
        height: { xs: 'auto', md: '100vh' }
      }}
    >
      <Stack
        direction={{ xs: 'column-reverse', md: 'row' }}
        justifyContent="center"
        gap={{ xs: 6, sm: 12 }}
        sx={{ height: { xs: '100%', md: '100vh' }, p: 2 }}
      >
        <PasswordUpdateForm />
      </Stack>
    </Stack>
  );
}
