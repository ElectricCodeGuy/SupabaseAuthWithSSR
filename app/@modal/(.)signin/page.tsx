import React from 'react';
import { Grid2 } from '@mui/material';
import SignInCard from './SignInCard';
import Content from '../Content';
import ModalWrapper from './ModalWrapper';
import { getSession } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

export default async function SignInModal() {
  const session = await getSession();

  if (session) {
    return null;
  }
  return (
    <ModalWrapper>
      <Grid2
        container
        gap={2}
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
          overflowX: 'hidden'
        }}
      >
        <Grid2
          size={{ xs: 12, md: 5.5 }}
          sx={{
            pb: {
              xs: 4,
              sm: 2,
              md: 0
            },
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            order: { xs: 2, md: 1 },
            borderRadius: 2
          }}
        >
          <Content />
        </Grid2>
        <Grid2
          size={{ xs: 12, md: 6 }}
          sx={{
            pt: {
              xs: 4,
              sm: 2,
              md: 1
            },
            pb: {
              xs: 0,
              sm: 0,
              md: 1
            },
            order: { xs: 1, md: 2 }
          }}
        >
          <SignInCard />
        </Grid2>
      </Grid2>
    </ModalWrapper>
  );
}
