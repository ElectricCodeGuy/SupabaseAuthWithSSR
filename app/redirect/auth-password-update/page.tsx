import 'server-only';
import React from 'react';
import { Stack } from '@mui/material';
import PasswordUpdateForm from './PasswordUpdateForm';

export default async function PasswordUpdatePage() {
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
