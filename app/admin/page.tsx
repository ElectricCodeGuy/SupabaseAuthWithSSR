import React from 'react';
import { type Metadata } from 'next';
import { Typography, Box, Button, TextField } from '@mui/material';
import {
  SentimentDissatisfied as SentimentDissatisfiedIcon,
  SentimentVeryDissatisfied as SentimentVeryDissatisfiedIcon,
  Report as ReportIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '🔒 Admin Panel 🕵️‍♂️',
  description:
    'This is definitely not the admin panel. Just move along, nothing interesting to see here... *whistles innocently*',
  keywords: [
    'completely normal page',
    'nothing suspicious',
    'just move along',
    'ordinary page',
    'completely ordinary',
    'no secrets',
    'boring page',
    'nothing to see here'
  ],
  robots: {
    follow: true,
    index: true
  }
};
const AdminPage: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: {
          xs: '100vh',
          sm: '100vh',
          md: 'calc(100vh - 44px)'
        },
        display: 'flex',
        flexDirection: 'column',
        background:
          'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
        backgroundSize: '400% 400%',
        animation: 'gradientBG 15s ease infinite',
        position: 'relative',
        '@keyframes gradientBG': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.08,
          pointerEvents: 'none',
          '@keyframes noise': {
            '0%': { transform: 'translate(0, 0) rotate(0deg)' },
            '10%': { transform: 'translate(-8%, -8%) rotate(1deg)' },
            '20%': { transform: 'translate(-15%, 5%) rotate(-1deg)' },
            '30%': { transform: 'translate(8%, -15%) rotate(2deg)' },
            '40%': { transform: 'translate(-8%, 20%) rotate(-2deg)' },
            '50%': { transform: 'translate(-15%, 8%) rotate(1deg)' },
            '60%': { transform: 'translate(20%, 0) rotate(-1deg)' },
            '70%': { transform: 'translate(0, 15%) rotate(2deg)' },
            '80%': { transform: 'translate(-20%, 0) rotate(-2deg)' },
            '90%': { transform: 'translate(15%, 8%) rotate(1deg)' },
            '100%': { transform: 'translate(8%, 0) rotate(0deg)' }
          }
        }
      }}
    >
      <Box
        sx={{
          flex: '1 0 auto',
          maxWidth: '1200px',
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          my: 10,
          p: 4, // Add padding
          borderRadius: 4,
          textAlign: 'center',
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          position: 'relative',
          zIndex: 1, // Add z-index to ensure content is clickable
          animation: 'fadeIn 1s ease-out',
          '@keyframes fadeIn': {
            from: { opacity: 0, transform: 'translateY(-20px)' },
            to: { opacity: 1, transform: 'translateY(0)' }
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            border: '2px solid transparent',
            borderRadius: 4,
            animation: 'borderGlow 4s linear infinite',
            pointerEvents: 'none', // Add this to ensure clicks go through
            zIndex: -1 // Place behind content
          },
          '@keyframes borderGlow': {
            '0%': { borderColor: 'rgba(255, 0, 0, 0)' },
            '50%': { borderColor: 'rgba(255, 0, 0, 0.5)' },
            '100%': { borderColor: 'rgba(255, 0, 0, 0)' }
          }
        }}
      >
        {[...Array(10)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              color: 'rgba(255, 0, 0, 0.4)',
              fontSize: '2rem',
              animation: `float ${Math.random() * 10 + 5}s ease-in-out infinite`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              '@keyframes float': {
                '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
                '50%': { transform: 'translateY(-20px) rotate(180deg)' }
              }
            }}
          >
            ⚠️
          </Box>
        ))}
        <WarningIcon
          sx={{
            fontSize: 100,
            color: 'error.main',
            animation: 'shake 0.5s ease-in-out infinite',
            '@keyframes shake': {
              '0%, 100%': { transform: 'rotate(0deg)' },
              '25%': { transform: 'rotate(-20deg)' },
              '75%': { transform: 'rotate(20deg)' }
            }
          }}
        />

        <Typography
          variant="h2"
          gutterBottom
          component="div"
          sx={{
            display: 'inline',
            fontWeight: 'bold',
            color: 'error.main',
            verticalAlign: 'middle',
            textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
            animation: 'glowText 2s ease-in-out infinite',
            '@keyframes glowText': {
              '0%, 100%': { textShadow: '2px 2px 4px rgba(255,0,0,0.2)' },
              '50%': { textShadow: '2px 2px 20px rgba(255,0,0,0.5)' }
            }
          }}
        >
          🚨 Access Denied! 🚫
        </Typography>

        <Typography
          variant="h4"
          gutterBottom
          sx={{
            mt: 2,
            color: 'text.primary',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ErrorIcon sx={{ fontSize: 40, mr: 1 }} />
          You do not have permission to access this page! 😠
        </Typography>
        <Typography
          variant="subtitle1"
          gutterBottom
          sx={{
            fontSize: { xs: '1rem', sm: '1.25rem' },
            color: 'text.secondary',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          <SentimentDissatisfiedIcon sx={{ fontSize: 30, mr: 1 }} />
          Don&apos;t worry, we have already sent a notification to our security
          department.
          <SentimentVeryDissatisfiedIcon sx={{ fontSize: 30, ml: 1 }} />
        </Typography>

        <TextField
          label="Username"
          variant="outlined"
          sx={{
            mb: 2,
            width: 400
          }}
          slotProps={{
            input: {
              readOnly: true
            }
          }}
          placeholder="Hint: It doesn't work"
        />
        <TextField
          label="Password"
          variant="outlined"
          sx={{ mb: 2, width: 400 }}
          slotProps={{
            input: {
              readOnly: true
            }
          }}
          placeholder="Try 123456 (it still doesn't work)"
        />
        <Button
          component={Link}
          variant="contained"
          color="primary"
          href="/admin"
          target="_blank"
          sx={{
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: 'error.main',
              transform: 'translateY(-3px)',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
            }
          }}
        >
          Try to log in
        </Button>
        <Button
          component={Link}
          variant="contained"
          color="error"
          sx={{
            mt: 2,
            background: 'linear-gradient(45deg, #FF0000, #FF6B6B)',
            animation: 'glowButton 1.5s ease-in-out infinite',
            '@keyframes glowButton': {
              '0%, 100%': {
                boxShadow: '0 0 5px #FF0000, 0 0 10px #FF0000, 0 0 15px #FF0000'
              },
              '50%': {
                boxShadow:
                  '0 0 20px #FF0000, 0 0 25px #FF0000, 0 0 30px #FF0000'
              }
            },
            '&:hover': {
              background: 'linear-gradient(45deg, #FF6B6B, #FF0000)',
              transform: 'scale(1.1) rotate(5deg)'
            }
          }}
          href="/"
          startIcon={<ReportIcon />}
        >
          <span>Leave this page now!</span>
        </Button>

        <Box
          sx={{
            mt: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeInOut 2s infinite',
            '@keyframes fadeInOut': {
              '0%, 100%': { opacity: 0.5 },
              '50%': { opacity: 1 }
            }
          }}
        >
          <LockIcon
            sx={{
              fontSize: 20,
              color: 'error.main',
              animation: 'glitch 1s ease infinite',
              '@keyframes glitch': {
                '0%, 100%': { transform: 'translate(0)' },
                '20%': { transform: 'translate(-5px, 5px)' },
                '40%': { transform: 'translate(-5px, -5px)' },
                '60%': { transform: 'translate(5px, 5px)' },
                '80%': { transform: 'translate(5px, -5px)' }
              }
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              position: 'relative'
            }}
          >
            This page is protected and monitored
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminPage;
