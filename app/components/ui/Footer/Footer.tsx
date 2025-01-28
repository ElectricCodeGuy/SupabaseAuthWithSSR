'use client';
import React from 'react';
import {
  Box,
  Grid2,
  Typography,
  IconButton,
  Divider,
  Button,
  Link as MuiLink
} from '@mui/material';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import YouTubeIcon from '@mui/icons-material/YouTube';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const Footer: React.FC = () => {
  const pathname = usePathname(); // Use the usePathname hook to access the router object

  // If the current pathname is '/aichat', or '/actionchat' do not render the component
  if (pathname.startsWith('/aichat') || pathname.startsWith('/actionchat')) {
    return null;
  }
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#333',
        paddingTop: {
          xs: '1rem'
        },
        color: 'white',
        mt: 'auto'
      }}
    >
      <Grid2
        container
        spacing={2}
        sx={{
          maxWidth: '1600px',
          mx: 'auto',
          px: 1,
          justifyContent: 'center',
          alignItems: 'flex-start'
        }}
      >
        <Grid2
          size={{
            xs: 6,
            sm: 6,
            md: 3.5,
            lg: 3.8,
            xl: 3.9
          }}
          sx={{
            p: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}
        >
          <Typography variant="h5">Contact</Typography>
          <Typography variant="body2" sx={{ color: 'white' }}>
            Example Company Name
          </Typography>
          <Typography variant="body2" sx={{ color: 'white' }}>
            123 Example Street, City 12345
          </Typography>
          <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
            ID: 12345678
          </Typography>
          <MuiLink component={Link} href="#" style={{ color: 'lightblue' }}>
            Privacy Policy
          </MuiLink>
          <MuiLink component={Link} href="#" style={{ color: 'lightblue' }}>
            Terms of Service
          </MuiLink>
        </Grid2>
        <Divider orientation="vertical" flexItem sx={{ bgcolor: 'white' }} />
        <Grid2
          size={{
            xs: 5,
            sm: 5,
            md: 2.8,
            lg: 2.8,
            xl: 2.8
          }}
          sx={{
            p: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}
        >
          <Typography variant="h5">Information:</Typography>
          <MuiLink component={Link} href="#" style={{ color: 'lightblue' }}>
            About Us
          </MuiLink>
          <MuiLink component={Link} href="#" style={{ color: 'lightblue' }}>
            Services
          </MuiLink>
          <MuiLink component={Link} href="#" style={{ color: 'lightblue' }}>
            FAQ
          </MuiLink>
          <MuiLink component={Link} href="#" style={{ color: 'lightblue' }}>
            How It Works
          </MuiLink>
          <MuiLink component={Link} href="#" style={{ color: 'lightblue' }}>
            Support
          </MuiLink>
        </Grid2>
        <Divider
          sx={{
            display: { xs: 'block', sm: 'block', md: 'none' },
            width: '100%',
            my: 1,
            bgcolor: 'white'
          }}
        />
        <Divider
          orientation="vertical"
          flexItem
          sx={{
            display: { xs: 'none', md: 'block' },
            height: 'auto',
            bgcolor: 'white'
          }}
        />
        <Grid2
          size={{
            xs: 12,
            sm: 12,
            md: 5,
            lg: 5,
            xl: 5
          }}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            px: 1
          }}
        >
          <Typography variant="h5">Subscribe to Our Newsletter</Typography>
          <Typography variant="body1" sx={{ color: 'white' }}>
            📧 Regular updates about our services
          </Typography>
          <Typography variant="body1" sx={{ color: 'white' }}>
            🔔 Special offers and promotions
          </Typography>
          <Typography variant="body1" sx={{ color: 'white' }}>
            💼 Industry news and insights
          </Typography>

          <Button
            variant="contained"
            color="primary"
            href="#"
            sx={{
              mt: 2,
              maxWidth: 200,
              alignSelf: {
                xs: 'center',
                sm: 'center',
                md: 'flex-start',
                lg: 'flex-start'
              }
            }}
          >
            Subscribe Now
          </Button>
        </Grid2>
      </Grid2>
      <Divider
        sx={{ mt: 1, bgcolor: 'white', maxWidth: '1580px', mx: 'auto' }}
      />
      <Grid2
        container
        sx={{
          maxWidth: '1600px',
          mx: 'auto',
          px: 1,
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Grid2 size="grow">
          <MuiLink component={Link} href="#" style={{ color: 'white' }}>
            Example Company &copy; {new Date().getFullYear()}
          </MuiLink>
        </Grid2>
        <Grid2 sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            href="#"
            aria-label="LinkedIn"
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <LinkedInIcon />
          </IconButton>
          <IconButton
            color="inherit"
            href="#"
            aria-label="YouTube"
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <YouTubeIcon />
          </IconButton>
        </Grid2>
      </Grid2>
    </Box>
  );
};

export default Footer;
