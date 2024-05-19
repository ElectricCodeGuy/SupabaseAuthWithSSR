import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Alert, Box } from '@mui/material';

export default function Messages() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const message = searchParams.get('message');

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      {error && (
        <Alert severity="error" sx={{ maxWidth: '90%' }}>
          {decodeURIComponent(error)}
        </Alert>
      )}
      {message && (
        <Alert severity="info" sx={{ maxWidth: '90%' }}>
          {decodeURIComponent(message)}
        </Alert>
      )}
    </Box>
  );
}
