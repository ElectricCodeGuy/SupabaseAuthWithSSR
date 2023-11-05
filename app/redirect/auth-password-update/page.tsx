'use client';
import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField'; // Use TextField directly from MUI
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { createClient } from '@/lib/client/client'; // Import your initialized Supabase client
import { useRouter } from 'next/navigation'; // Note: changed from 'next/navigation' to 'next/router'

const PasswordUpdateForm: React.FC = () => {
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const supabase = createClient(); // Initialize your Supabase client

  const router = useRouter(); // Initialize the useRouter hook

  useEffect(() => {
    // If there's a success message, redirect after a delay
    if (success) {
      const timer = setTimeout(() => {
        router.push('/'); // Redirect to the homepage
      }, 5000); // Redirect after 5 seconds

      // Cleanup the timer on component unmount
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords must match.');
      return;
    }

    // Call Supabase to update the password
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Password updated successfully. Redirecting...');
      setError('');
      // Optionally, start the redirection timer here as well
      // setTimeout(() => { router.push('/'); }, 5000);
    }
  };

  return (
    <Box
      sx={{
        mt: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <Typography component="h1" variant="h5">
        Update Password
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
        <TextField
          id="newPassword"
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          variant="outlined"
          margin="normal"
          fullWidth
          InputProps={{
            startAdornment: <LockOutlinedIcon />
          }}
        />
        <TextField
          id="confirmPassword"
          label="Confirm New Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          variant="outlined"
          margin="normal"
          fullWidth
          InputProps={{
            startAdornment: <LockOutlinedIcon />
          }}
        />
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
        {success && (
          <Typography color="primary" sx={{ mt: 2 }}>
            {success}
          </Typography>
        )}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
        >
          Update Password
        </Button>
      </Box>
    </Box>
  );
};

export default PasswordUpdateForm;
