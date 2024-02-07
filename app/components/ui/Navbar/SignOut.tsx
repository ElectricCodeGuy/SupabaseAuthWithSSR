import React from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { signout } from '@/app/auth/action';

export default function SignOut() {
  return (
    <Box>
      <form action={signout}>
        <Button type="submit" variant="contained" color="primary">
          Sign Out
        </Button>
      </form>
    </Box>
  );
}
