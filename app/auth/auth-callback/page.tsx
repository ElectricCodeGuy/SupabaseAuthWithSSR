'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Container from '@mui/material/Container';
import Loader from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import Slide from '@mui/material/Slide';

const Page = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect user after 5 seconds
    const timer = setTimeout(() => {
      router.push('/'); // Redirect to the default page
    }, 5000);

    // Cleanup function to clear the timer if the component unmounts
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Container>
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh" // Full viewport height
      >
        <Fade in={true} timeout={500}>
          <Box textAlign="center">
            <Slide direction="up" in={true} timeout={500}>
              <Loader size={50} />
            </Slide>
            <Typography variant="h5" gutterBottom>
              Signing you in. Please wait...
            </Typography>
            <Fade in={true} timeout={1000}>
              <Typography variant="body2">
                You will be redirected automatically.
              </Typography>
            </Fade>
          </Box>
        </Fade>
      </Box>
    </Container>
  );
};

export default Page;
