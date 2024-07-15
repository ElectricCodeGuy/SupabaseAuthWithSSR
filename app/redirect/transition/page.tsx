'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Fade from '@mui/material/Fade';

function TransitionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const method = searchParams.get('method'); // get the authentication method from the URL
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCompleted(true);
      // Redirect to the homepage after a delay when the process is completed
      setTimeout(() => {
        router.push('/');
      }, 1000);
    }, 4000);

    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, [router]);

  // Extend the messages object to include a message for the 'recovery' method
  const messages: Record<string, string> = {
    password: 'Logging in...',
    otp: 'Verifying OTP...',
    exchange: 'Exchanging session...',
    code: 'Verifying code...',
    recovery: 'Your password has been updated. Redirecting...', // Add this line for the recovery method
    default: 'Processing...'
  };

  const messageToShow = completed
    ? 'Done!'
    : messages[method || 'default'] || messages.default;

  return (
    <Box
      sx={{
        mt: 8,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <Fade
        in={true}
        timeout={{ enter: 1000, exit: 500 }}
        style={{ transition: 'ease-in-out' }}
      >
        <Typography variant="h4" gutterBottom>
          {messageToShow}
        </Typography>
      </Fade>

      {!completed && (
        <>
          <Fade
            in={true}
            timeout={{ enter: 1500, exit: 500 }}
            style={{ transition: 'ease-in-out' }}
          >
            <Box sx={{ mb: 3, transform: 'scale(1.1)' }}>
              <CircularProgress color="secondary" />
            </Box>
          </Fade>

          <Fade
            in={true}
            timeout={{ enter: 2000, exit: 500 }}
            style={{ transition: 'ease-in-out' }}
          >
            <Alert severity="info" sx={{ maxWidth: '90%' }}>
              Please wait a moment.
            </Alert>
          </Fade>
        </>
      )}
    </Box>
  );
}

export default TransitionPage;
