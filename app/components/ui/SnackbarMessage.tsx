'use client';
import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Snackbar, Alert, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function SnackbarMessages() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const error = searchParams.get('error');
  const message = searchParams.get('message');

  const handleClose = () => {
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.delete('error');
    currentParams.delete('message');
    const newPath = window.location.pathname + '?' + currentParams.toString();
    router.replace(newPath);
  };

  if (!error && !message) return null;

  const severity = error ? 'error' : 'success';
  const content = error
    ? decodeURIComponent(error)
    : decodeURIComponent(message!);

  return (
    <Snackbar
      open
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      sx={{
        '& .MuiSnackbarContent-root': {
          minWidth: '300px',
          boxShadow:
            '0px 3px 5px -1px rgba(0,0,0,0.2), 0px 6px 10px 0px rgba(0,0,0,0.14), 0px 1px 18px 0px rgba(0,0,0,0.12)'
        }
      }}
    >
      <Alert
        severity={severity}
        variant="filled"
        elevation={6}
        sx={{
          width: '100%',
          '& .MuiAlert-icon': {
            fontSize: '1.5rem'
          },
          '& .MuiAlert-message': {
            fontSize: '1rem',
            fontWeight: 500
          }
        }}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        {content}
      </Alert>
    </Snackbar>
  );
}
