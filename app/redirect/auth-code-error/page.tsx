import React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from 'next/link';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const AuthCodeErrorPage: React.FC = () => {
  return (
    <Container
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center'
      }}
    >
      <ErrorOutlineIcon sx={{ fontSize: '6rem', color: 'red' }} />

      <Typography variant="h4" gutterBottom>
        Authentication Error
      </Typography>

      <Typography variant="body1" paragraph>
        Oops! There seems to be an issue with the authentication code you
        provided.
      </Typography>

      <Typography variant="body2" paragraph>
        This could be due to an expired code, a typographical error, or an
        invalid request. Please ensure you&apos;ve used the most recent code
        sent to your email. If the issue persists, consider the following
        options:
      </Typography>

      <Link href="/auth/signup" passHref>
        <Button variant="outlined" color="primary" sx={{ m: 1 }}>
          Try again
        </Button>
      </Link>

      <Link href="/" passHref>
        <Button variant="contained" color="primary" sx={{ m: 1 }}>
          Go to Home
        </Button>
      </Link>

      <Typography variant="body2" color="textSecondary">
        Need further assistance? Contact our{' '}
        <Link href="/support">support team</Link>.
      </Typography>
    </Container>
  );
};

export default AuthCodeErrorPage;
