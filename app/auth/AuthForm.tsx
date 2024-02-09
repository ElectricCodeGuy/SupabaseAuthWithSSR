'use client';
import React, { useState, useCallback } from 'react';
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
import WorkIcon from '@mui/icons-material/Work';
import { login, signup, resetPasswordForEmail, addToWaitlist } from './action';

const AuthFormContent: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [workTitle, setWorkTitle] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const as = searchParams.get('as') || 'signin';

  const handleStateChange = useCallback(
    (newState: string) => {
      const params = new URLSearchParams();
      params.set('as', newState);
      const newUrl = `${pathname}?${params.toString()}`;
      router.push(newUrl);
    },
    [pathname, router]
  );
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('fullName', fullName);
    formData.append('workTitle', workTitle);

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
      case 'waitlist':
        await addToWaitlist(formData);
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
          ? 'Log Ind'
          : as === 'signup'
            ? 'Opret Konto'
            : as === 'reset'
              ? 'Nulstil Adgangskode'
              : as === 'waitlist'
                ? 'Tilmeld Venteliste'
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
              label="Email Adresse"
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
            label="Email Adresse"
            value={email}
            onChange={setEmail}
            icon={<EmailIcon />}
          />
        )}
        {as === 'waitlist' && (
          <>
            <FormInput
              id="email"
              label="Email Adresse"
              value={email}
              onChange={setEmail}
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
              id="workTitle"
              label="Erhverv"
              value={workTitle}
              onChange={(value) => setWorkTitle(value)}
              icon={<WorkIcon />}
            />
          </>
        )}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
        >
          {as === 'signin'
            ? 'Log Ind'
            : as === 'signup'
              ? 'Opret Konto'
              : as === 'reset'
                ? 'Nulstil Adgangskode'
                : as === 'waitlist'
                  ? 'Tilmeld Venteliste' // Text for the waitlist state
                  : 'Submit'}{' '}
        </Button>

        <Messages />
        <Button onClick={() => handleStateChange('signin')}>Log Ind</Button>
        <Button onClick={() => handleStateChange('signup')}>Opret Konto</Button>
        <Button onClick={() => handleStateChange('reset')}>
          Nulstil Adgangskode
        </Button>
        <Button onClick={() => handleStateChange('waitlist')}>
          Venteliste
        </Button>
      </Box>
    </Box>
  );
};

export default AuthFormContent;
