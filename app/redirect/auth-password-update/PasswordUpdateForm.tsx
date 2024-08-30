'use client';
import React, { useState, type FC } from 'react';
import {
  Button,
  Box,
  Card,
  Typography,
  Stack,
  TextField,
  CircularProgress
} from '@mui/material';
import { resetPassword } from './action';
import { LockOutlined as LockOutlinedIcon } from '@mui/icons-material';
import { useFormStatus } from 'react-dom';
import Message from './messages';

const PasswordUpdateForm: FC = () => {
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  });

  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password)
    };
    setPasswordRequirements(requirements);
  };

  const handleSubmit = async (formData: FormData) => {
    // Check if the passwords match
    if (newPassword !== confirmPassword) {
      alert('Passwords must match.');
      return;
    }
    await resetPassword(formData);
  };

  return (
    <Stack
      direction="column"
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '90vh'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          maxWidth: '800px'
        }}
      >
        <Card
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignSelf: 'center',
            borderRadius: '16px',
            width: { xs: '100%', sm: '350px', md: '500px' }, // Reduced width
            p: { xs: 1, sm: 1.5, md: 4 }, // Reduced padding
            gap: { xs: 1, sm: 1.5, md: 2 },
            boxShadow:
              'rgba(0, 0, 0, 0.05) 0px 5px 15px 0px, rgba(25, 28, 33, 0.05) 0px 15px 35px -5px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px'
          }}
        >
          <Typography component="h1" variant="h5">
            Update Password
          </Typography>
          <Box
            component="form"
            action={handleSubmit}
            noValidate
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              gap: { xs: 0.5, sm: 0.5, md: 1 }
            }}
          >
            <TextField
              id="newPassword"
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                validatePassword(e.target.value);
              }}
              autoComplete="new-password"
              variant="outlined"
              margin="normal"
              fullWidth
              slotProps={{
                input: {
                  startAdornment: <LockOutlinedIcon />
                }
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
              slotProps={{
                input: {
                  startAdornment: <LockOutlinedIcon />
                }
              }}
            />
            <Message />
            <SubmitButton />
          </Box>
        </Card>
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            justifyContent: 'center',
            alignItems: 'center',
            ml: 2
          }}
        >
          <PasswordRequirements requirements={passwordRequirements} />
        </Box>
      </Box>
    </Stack>
  );
};

export default PasswordUpdateForm;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Button
        type="submit"
        variant="contained"
        disabled={pending}
        sx={{ width: '200px' }} // Adjust the width as needed
      >
        {pending ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          'Update Password'
        )}
      </Button>
    </Box>
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
        padding: '8px',
        ml: 2
      }}
    >
      <Typography variant="subtitle2" gutterBottom>
        Password Requirements:
      </Typography>
      <ul style={{ paddingLeft: '20px', margin: 0 }}>
        <li style={{ color: requirements.length ? 'green' : 'red' }}>
          Length (at least 6 characters)
        </li>
        <li style={{ color: requirements.uppercase ? 'green' : 'red' }}>
          Uppercase letter
        </li>
        <li style={{ color: requirements.lowercase ? 'green' : 'red' }}>
          Lowercase letter
        </li>
        <li style={{ color: requirements.number ? 'green' : 'red' }}>Number</li>
      </ul>
    </Box>
  );
}
