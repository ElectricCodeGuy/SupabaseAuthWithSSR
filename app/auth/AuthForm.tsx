'use client';
import React, { useState, useCallback, FC, FormEvent } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormInput from './FormInput';
import EmailIcon from '@mui/icons-material/Email';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonIcon from '@mui/icons-material/Person';
import Messages from './messages';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { login, signup, resetPasswordForEmail } from './action';
import { useFormStatus } from 'react-dom';
import CircularProgress from '@mui/material/CircularProgress';

const AuthFormContent: FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const as = searchParams.get('as') || 'signin';

  const { pending } = useFormStatus();

  const handleStateChange = useCallback(
    (newState: string) => {
      const params = new URLSearchParams();
      params.set('as', newState);
      const newUrl = `${pathname}?${params.toString()}`;
      router.push(newUrl);
    },
    [pathname, router]
  );
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('fullName', fullName);

    switch (as) {
      case 'signin':
        await login(formData);
        break;
      case 'signup':
        await signup(formData);
        break;
      case 'reset':
        await resetPasswordForEmail(formData);
        break;
      default:
        console.error('Invalid as');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        p: 4,
        borderRadius: 2,
        width: '100%'
      }}
    >
      <Button
        onClick={() => router.push('/')} // Navigate to the homepage
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          color: '#1976d2'
        }}
      >
        Tilbage
      </Button>
      <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
        <LockOutlinedIcon />
      </Avatar>
      <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
        {as === 'signin'
          ? 'Sign In'
          : as === 'signup'
            ? 'Create Account'
            : as === 'reset'
              ? 'Reset Password'
              : 'Welcome'}{' '}
      </Typography>

      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit} // Use onSubmit handler for form submission
        sx={{ mt: 1, width: '100%' }}
      >
        {as === 'signin' && (
          <>
            <FormInput
              id="email"
              label="Email Adresse"
              value={email}
              onChange={setEmail}
              icon={<EmailIcon />}
            />
            <FormInput
              id="password"
              label="Adgangskode"
              type="password"
              value={password}
              onChange={setPassword}
              icon={<LockOutlinedIcon />}
            />
          </>
        )}
        {as === 'signup' && (
          <>
            <FormInput
              id="email"
              label="Email Address"
              value={email}
              onChange={(value) => setEmail(value)}
              icon={<EmailIcon />}
            />
            <FormInput
              id="fullName"
              label="Fulde Navn"
              value={fullName}
              onChange={(value) => setFullName(value)}
              icon={<PersonIcon />}
            />
            <FormInput
              id="password"
              label="Adgangskode"
              type="password"
              value={password}
              onChange={(value) => setPassword(value)}
              icon={<LockOutlinedIcon />}
            />
          </>
        )}
        {as === 'reset' && (
          <FormInput
            id="email"
            label="Email Address"
            value={email}
            onChange={setEmail}
            icon={<EmailIcon />}
          />
        )}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={pending}
          sx={{ mt: 3, mb: 2 }}
        >
          {pending ? (
            <CircularProgress
              size={24}
              sx={{
                color: 'white',
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginTop: '-12px',
                marginLeft: '-12px'
              }}
            />
          ) : as === 'signin' ? (
            'Sign in'
          ) : as === 'signup' ? (
            'Sign up'
          ) : as === 'reset' ? (
            'Reset Password'
          ) : (
            'Submit'
          )}
        </Button>

        <Messages />
        <Button onClick={() => handleStateChange('signin')}>Sign in</Button>
        <Button onClick={() => handleStateChange('signup')}>
          Create Account
        </Button>
        <Button onClick={() => handleStateChange('reset')}>
          Reset Password
        </Button>
      </Box>
    </Box>
  );
};

export default AuthFormContent;
