import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  OutlinedInput,
  CircularProgress,
  Box,
  Typography
} from '@mui/material';
import { useFormStatus } from 'react-dom';
import { resetPasswordForEmail } from './action';
import Message from './messages';

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
  const handleSubmit = async (formData: FormData) => {
    formData.append('email', email);
    if (email.trim() === '') {
      setError('Email address is required');
      return;
    }
    await resetPasswordForEmail(formData);
    setError('');
    setEmail('');
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Reset Password</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Enter the email address associated with your account, and we&apos;ll
          send you a link to reset your password.
        </DialogContentText>
        <Box
          component="form"
          action={handleSubmit}
          noValidate
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            gap: 2
          }}
        >
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
          />
          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
          <SubmitButton />
          <Message />
        </Box>
      </DialogContent>
      <DialogActions sx={{ pb: 3, px: 3 }}>
        <Button onClick={handleClose}>Cancel</Button>
      </DialogActions>
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
