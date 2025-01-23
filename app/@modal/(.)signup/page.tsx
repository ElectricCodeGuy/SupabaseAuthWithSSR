import React from 'react';
import { Grid2 } from '@mui/material';
import SignUpCard from './SignUpCard';
import Content from '../Content';
import ModalWrapper from './ModalWrapper';
import { getSession } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

export default async function SignUpModal() {
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
          width: '100%'
        }}
      >
        <Grid2
          size={{ xs: 12, md: 5.5 }}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            pb: {
              xs: 4,
              sm: 2,
              md: 0
            },
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
              md: 0
            },
            order: { xs: 1, md: 2 }
          }}
        >
          <SignUpCard />
        </Grid2>
      </Grid2>
    </ModalWrapper>
  );
}
