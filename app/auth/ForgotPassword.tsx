import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  OutlinedInput,
  CircularProgress,
  Box,
  Typography
} from '@mui/material';
import { useFormStatus } from 'react-dom';
import { resetPasswordForEmail } from './action';
import Message from './messages';
import { usePathname } from 'next/navigation';

interface ForgotPasswordProps {
  open: boolean;
  handleClose: () => void;
}

export default function ForgotPassword({
  open,
  handleClose
}: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const currentPathname = usePathname();

  const handleSubmit = async (formData: FormData) => {
    formData.append('currentPathname', currentPathname);
    if (email.trim() === '') {
      setError('Email address is required');
      return;
    }
    await resetPasswordForEmail(formData);
    setError('');
    setEmail('');
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth>
      <Box
        component="form"
        action={handleSubmit}
        noValidate
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          p: 2
        }}
      >
        <DialogTitle sx={{ px: 0, py: 2 }}>Reset Password</DialogTitle>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Enter your account&apos;s email address, and we&apos;ll send you a
          link to reset your password.
        </Typography>
        <OutlinedInput
          required
          margin="dense"
          id="email"
          name="email"
          placeholder="Email address"
          type="email"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
        />
        {error && (
          <Typography
            variant="body2"
            sx={{
              color: 'error',
              mb: 2
            }}
          >
            {error}
          </Typography>
        )}
        <SubmitButton />
        <Message />
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={handleClose}>Cancel</Button>
        </Box>
      </Box>
    </Dialog>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" fullWidth variant="contained" disabled={pending}>
      {pending ? <CircularProgress size={24} color="inherit" /> : 'Continue'}
    </Button>
  );
}
