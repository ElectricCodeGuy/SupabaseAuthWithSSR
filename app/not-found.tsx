// pages/404.tsx
import React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import HomeIcon from '@mui/icons-material/Home';
import Link from 'next/link';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const Custom404: React.FC = () => {
  return (
    <Container
      maxWidth="sm"
      sx={{
        textAlign: 'center',
        paddingTop: { xs: '5rem', md: '10rem' },
        paddingBottom: '5rem'
      }}
      className="custom-404-page"
    >
      <Box sx={{ marginBottom: '2rem' }}>
        <HelpOutlineIcon
          sx={{
            fontSize: { xs: 80, md: 150 },
            color: 'primary.main'
          }}
        />
      </Box>
      <Typography variant="h4" gutterBottom>
        Oops! We couldn&apos;t find that page.
      </Typography>
      <Typography variant="body1" paragraph>
        It looks like the page you&apos;re looking for doesn&apos;t exist or has
        been moved.
      </Typography>
      <Typography variant="body2" sx={{ marginBottom: '2rem' }}>
        You can try searching for what you need or go back to the homepage.
      </Typography>
      <Link href="/" passHref>
        <Button variant="contained" startIcon={<HomeIcon />} color="primary">
          Back to Home
        </Button>
      </Link>
    </Container>
  );
};

export default Custom404;
