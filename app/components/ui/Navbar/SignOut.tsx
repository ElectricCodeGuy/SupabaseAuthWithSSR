import React from 'react';
import { Button, Box, CircularProgress } from '@mui/material';
import { signout } from '@/app/auth/action';
import { useFormStatus } from 'react-dom';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

export default function SignOut() {
  return (
    <Box
      component="form"
      action={signout}
      sx={{ display: 'flex', justifyContent: 'center' }}
    >
      <SubmitButton />
    </Box>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      fullWidth
      variant="outlined"
      disabled={pending}
      startIcon={<ExitToAppIcon />}
      sx={{ borderRadius: '50px' }}
    >
      {pending ? <CircularProgress size={24} color="inherit" /> : 'Sign out'}
    </Button>
  );
}
