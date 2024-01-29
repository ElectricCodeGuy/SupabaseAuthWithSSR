'use client';

import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
//import HCaptcha from '@hcaptcha/react-hcaptcha';
import FormInput from './FormInput';
import EmailIcon from '@mui/icons-material/Email';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonIcon from '@mui/icons-material/Person';
import Messages from './messages';
import Avatar from '@mui/material/Avatar';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import { signInWithProvider } from './authHelpers';
import Image from 'next/image';

type AuthState = 'signin' | 'signup' | 'reset';
type OAuthProvider = 'google' | 'github';

interface AuthFormProps {
  authState: AuthState;
}

const AuthForm: React.FC<AuthFormProps> = ({ authState }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  /*
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(
    undefined
  );
  */
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  //const captchaRef = useRef<HCaptcha>(null);

  const formAction = {
    signin: '/api/auth/sign-in',
    signup: '/api/auth/sign-up',
    reset: '/api/auth/reset-password'
  }[authState];
  const handleProviderSignIn = (selectedProvider: OAuthProvider) => {
    signInWithProvider(selectedProvider);
  };

  return (
    <Grid
      container
      component="main"
      sx={{ height: '100vh', overflow: 'hidden' }}
    >
      <Grid
        item
        xs={12}
        sm={4}
        md={6}
        sx={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: isMobile ? 2 : 4
        }}
      >
        {isMobile && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: -1,
              '& > span': {
                height: '100% !important'
              }
            }}
          >
            <Image
              src="https://source.unsplash.com/random?wallpapers"
              alt="Background"
              fill // Using `fill` to cover the parent box
              style={{ objectFit: 'cover', objectPosition: 'center' }} // Direct styles for object-fit and object-position
            />
          </Box>
        )}
        {!isMobile && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              '& > span': {
                height: '100% !important'
              }
            }}
          >
            <Image
              src="https://source.unsplash.com/random?wallpapers"
              alt="Background"
              fill
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
          </Box>
        )}
      </Grid>
      <Grid
        item
        xs={12}
        sm={8}
        md={6}
        component={Paper}
        elevation={6}
        square
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: isMobile ? 2 : 4
        }}
      >
        <Box
          sx={{
            mx: 4,
            my: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            maxWidth: '400px',
            margin: '0 auto'
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5" sx={{ mb: 1 }}>
            {authState === 'signin'
              ? 'Sign In'
              : authState === 'signup'
                ? 'Sign Up'
                : 'Reset Password'}
          </Typography>
          <Box
            component="form"
            noValidate
            action={formAction}
            method="post"
            sx={{ mt: 1 }}
            encType="multipart/form-data"
          >
            {authState === 'signin' && (
              <>
                <FormInput
                  id="email"
                  label="Email Address"
                  value={email}
                  onChange={setEmail}
                  icon={<EmailIcon />}
                />
                <FormInput
                  id="password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  icon={<LockOutlinedIcon />}
                />
                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: 1,
                    mb: 1,
                    backgroundColor: '#4285F4',
                    '&:hover': { backgroundColor: '#2C75F4' }
                  }}
                  startIcon={<GoogleIcon />}
                  onClick={() => {
                    console.log('Attempting to sign in with Google');
                    handleProviderSignIn('google');
                  }}
                >
                  Sign In with Google
                </Button>

                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: 1,
                    mb: 1,
                    backgroundColor: '#24292E',
                    '&:hover': { backgroundColor: '#1E2226' }
                  }}
                  startIcon={<GitHubIcon />}
                  onClick={() => {
                    console.log('Attempting to sign in with GitHub');
                    handleProviderSignIn('github');
                  }}
                >
                  Sign In with GitHub
                </Button>
              </>
            )}
            {authState === 'signup' && (
              <>
                <FormInput
                  id="email"
                  label="Email Address"
                  value={email}
                  onChange={setEmail}
                  icon={<EmailIcon />}
                />
                <FormInput
                  id="fullName"
                  label="Full Name"
                  value={fullName}
                  onChange={setFullName}
                  icon={<PersonIcon />}
                />
                <FormInput
                  id="password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  icon={<LockOutlinedIcon />}
                />
              </>
            )}
            {authState === 'reset' && (
              <FormInput
                id="email"
                label="Email Address"
                value={email}
                onChange={setEmail}
                icon={<EmailIcon />}
              />
            )}
            {/* 
            <HCaptcha
              ref={captchaRef}
              sitekey="CHAPCHA_SITE_KEY"
              theme="dark"
              onVerify={(token, _ekey) => {
                setCaptchaToken(token);
              }}
            />
            <input
              type="hidden"
              name="captchaToken"
              value={captchaToken || ''}
            />
            */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 1, mb: 1 }}
            >
              {authState === 'signin'
                ? 'Sign In'
                : authState === 'signup'
                  ? 'Sign Up'
                  : 'Reset Password'}
            </Button>
            <Messages />
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
};

export default AuthForm;
