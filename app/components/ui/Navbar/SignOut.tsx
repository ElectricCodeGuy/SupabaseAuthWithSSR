import React from 'react';
import { Button, Box, CircularProgress } from '@mui/material';
import { signout } from '@/app/auth/action';
import { useFormStatus } from 'react-dom';

export default function SignOut() {
  return (
    <Box
      component="form"
      action={signout}
      sx={{
        display: 'flex',
        justifyContent: 'center'
      }}
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
      variant="contained"
      disabled={pending}
      sx={{ borderRadius: '50px' }}
    >
      {pending ? <CircularProgress size={24} color="inherit" /> : 'Log ud'}
    </Button>
  );
}
