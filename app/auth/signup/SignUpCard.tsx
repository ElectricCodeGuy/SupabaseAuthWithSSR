'use client';
import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  Divider,
  FormLabel,
  FormControl,
  TextField,
  Typography,
  CircularProgress
} from '@mui/material';
import ForgotPassword from '../signin/ForgotPassword';
import Message from '../messages';
import { GoogleIcon } from '../CustomIcons';
import { signup } from '../action';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { signInWithGoogle } from '../signin/OAuth';

export default function SignInCard() {
  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [confirmPasswordErrorMessage, setConfirmPasswordErrorMessage] =
    useState('');
  const [open, setOpen] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  });
  const handleClose = () => {
    setOpen(false);
  };
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    if (validateInputs()) {
      await signup(formData);
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
      setPasswordErrorMessage('Password cannot be empty.');
      isValid = false;
    } else {
      let passwordErrorMessage = '';

      if (password.length < 6) {
        passwordErrorMessage += 'Password must be at least 6 characters long. ';
        isValid = false;
      }

      if (!/\d/.test(password)) {
        passwordErrorMessage += 'Password must contain at least one number. ';
        isValid = false;
      }

      if (!isValid) {
        setPasswordError(true);
        setPasswordErrorMessage(passwordErrorMessage.trim());
      } else {
        setPasswordError(false);
        setPasswordErrorMessage('');
      }
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError(true);
      setConfirmPasswordErrorMessage('Passwords do not match.');
      isValid = false;
    } else {
      setConfirmPasswordError(false);
      setConfirmPasswordErrorMessage('');
    }

    return isValid;
  }, [email, password, confirmPassword]);

  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password)
    };
    setPasswordRequirements(requirements);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <Card
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignSelf: 'center',
          width: { xs: '100%', sm: '350px', md: '400px' }, // Reduced width
          p: { xs: 1, sm: 1.5, md: 2 }, // Reduced padding
          gap: { xs: 1, sm: 1, md: 1 },
          boxShadow:
            'rgba(0, 0, 0, 0.05) 0px 5px 15px 0px, rgba(25, 28, 33, 0.05) 0px 15px 35px -5px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px'
        }}
      >
        <Typography variant="h1" sx={{ width: '100%' }}>
          Sign Up
        </Typography>
        <Box
          component="form"
          action={handleSubmit}
          noValidate
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            '& .MuiFormControl-root': {
              gap: { xs: 0.25, sm: 0.5, md: 0.75 } // Reduced gap for FormControls
            }
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
            <FormLabel htmlFor="fullName">Full Name</FormLabel>
            <TextField
              id="fullName"
              name="fullName"
              placeholder="John Doe"
              autoComplete="name"
              fullWidth
              variant="outlined"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="password">Password</FormLabel>
            <TextField
              error={passwordError}
              helperText={passwordErrorMessage}
              name="password"
              placeholder="••••••"
              type="password"
              id="password"
              autoComplete="new-password"
              required
              fullWidth
              variant="outlined"
              color={passwordError ? 'error' : 'primary'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                validatePassword(e.target.value);
              }}
            />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="confirmPassword">Confirm Password</FormLabel>
            <TextField
              error={confirmPasswordError}
              helperText={confirmPasswordErrorMessage}
              name="confirmPassword"
              placeholder="••••••"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              required
              fullWidth
              variant="outlined"
              color={confirmPasswordError ? 'error' : 'primary'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </FormControl>
          <SubmitButton />
          <Message />
          <Button
            variant="text"
            sx={{ alignSelf: 'center' }}
            onClick={() => router.push('/auth/signin')}
          >
            Already have an account?
          </Button>
        </Box>
        <Divider>or</Divider>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 1, sm: 1.5, md: 2 }
          }}
        >
          <Button
            type="submit"
            fullWidth
            variant="outlined"
            color="secondary"
            onClick={() => signInWithGoogle()}
            startIcon={<GoogleIcon />}
          >
            Sign up with Google
          </Button>
        </Box>
        <ForgotPassword open={open} handleClose={handleClose} />
      </Card>
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          justifyContent: 'center',
          alignItems: 'center',
          ml: 2
        }}
      >
        <PasswordRequirements requirements={passwordRequirements} />
      </Box>
    </Box>
  );
}
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" fullWidth variant="contained" disabled={pending}>
      {pending ? (
        <CircularProgress size={24} color="inherit" />
      ) : (
        'Create Account'
      )}
    </Button>
  );
}

interface PasswordRequirementsProps {
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
  };
}

function PasswordRequirements({ requirements }: PasswordRequirementsProps) {
  return (
    <Box
      sx={{
        width: '240px',
        backgroundColor: 'white',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        borderRadius: '16px',
        padding: '8px'
      }}
    >
      <Typography variant="subtitle2" gutterBottom>
        Password Requirements:
      </Typography>
      <ul style={{ paddingLeft: '20px', margin: 0 }}>
        <li style={{ color: requirements.length ? 'green' : 'red' }}>
          Length (at least 6 characters)
        </li>
        <li style={{ color: requirements.number ? 'green' : 'red' }}>Number</li>
      </ul>
    </Box>
  );
}
