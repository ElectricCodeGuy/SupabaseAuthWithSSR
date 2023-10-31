'use client';

import { useSearchParams } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';

export default function Messages() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const message = searchParams.get('message');

  return (
    <Box
      sx={{
        mt: 4,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2, maxWidth: '90%' }}>
          {error}
        </Alert>
      )}
      {message && (
        <Alert severity="info" sx={{ mb: 2, maxWidth: '90%' }}>
          {message}
        </Alert>
      )}
    </Box>
  );
}
