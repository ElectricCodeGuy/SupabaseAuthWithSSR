'use client';
import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  Checkbox,
  Divider,
  FormLabel,
  FormControl,
  FormControlLabel,
  TextField,
  Typography,
  CircularProgress
} from '@mui/material';
import ForgotPassword from './ForgotPassword';
import { GoogleIcon } from '../CustomIcons';
import { login } from '../action';
import { signInWithGoogle } from './OAuth';
import { useRouter } from 'next/navigation';
import Message from '../messages';
import { useFormStatus } from 'react-dom';

export default function SignInCard() {
  const [email, setEmail] = useState(
    typeof window !== 'undefined'
      ? localStorage.getItem('rememberedEmail') || ''
      : ''
  );
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(
    typeof window !== 'undefined' && !!localStorage.getItem('rememberedEmail')
  );
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async (formData: FormData) => {
    if (validateInputs()) {
      await login(formData);
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
    }
  };

  const validateInputs = useCallback(() => {
    let isValid = true;
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }
    if (!password.trim()) {
      setPasswordError(true);
      setPasswordErrorMessage('Error in password');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }
    return isValid;
  }, [email, password]);

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignSelf: 'center',
        width: { xs: '100%', sm: '450px' },
        p: { xs: 2, sm: 3 },
        gap: 1,
        boxShadow:
          'rgba(0, 0, 0, 0.05) 0px 5px 15px 0px, rgba(25, 28, 33, 0.05) 0px 15px 35px -5px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px'
      }}
    >
      <Typography
        component="h1"
        variant="h4"
        sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
      >
        Sign In
      </Typography>
      <Box
        component="form"
        action={handleSubmit}
        noValidate
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          gap: 1
        }}
      >
        <FormControl>
          <FormLabel htmlFor="email">Email</FormLabel>
          <TextField
            error={emailError}
            helperText={emailErrorMessage}
            id="email"
            type="email"
            name="email"
            placeholder="your@email.com"
            autoComplete="email"
            required
            fullWidth
            variant="outlined"
            color={emailError ? 'error' : 'primary'}
            sx={{ ariaLabel: 'email' }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormControl>
        <FormControl>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <FormLabel htmlFor="password">Password</FormLabel>
            <Button
              onClick={handleClickOpen}
              variant="text"
              sx={{ alignSelf: 'baseline', padding: 0, minWidth: 'auto' }}
            >
              Forgot your password?
            </Button>
          </Box>
          <TextField
            error={passwordError}
            helperText={passwordErrorMessage}
            name="password"
            placeholder="••••••"
            type="password"
            id="password"
            autoComplete="current-password"
            required
            fullWidth
            variant="outlined"
            color={passwordError ? 'error' : 'primary'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormControl>
        <FormControlLabel
          control={
            <Checkbox
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              color="primary"
            />
          }
          label="Remember me"
        />
        <ForgotPassword open={open} handleClose={handleClose} />
        <SubmitButton />
        <Message />
        <Button
          variant="text"
          sx={{ alignSelf: 'center' }}
          onClick={() => router.push('/auth/signup')}
        >
          Don&apos;t have an account? Sign up
        </Button>
      </Box>
      <Divider>or</Divider>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button
          type="submit"
          fullWidth
          variant="outlined"
          color="secondary"
          onClick={() => signInWithGoogle()}
          startIcon={<GoogleIcon />}
        >
          Sign in with Google
        </Button>
      </Box>
    </Card>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" fullWidth variant="contained" disabled={pending}>
      {pending ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
    </Button>
  );
}
