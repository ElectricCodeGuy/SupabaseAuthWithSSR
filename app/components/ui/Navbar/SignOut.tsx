import React from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

export default function SignOut() {
  return (
    <Box>
      <form action="/api/auth/sign-out" method="post">
        <Button type="submit" variant="contained" color="primary">
          Sign Out
        </Button>
      </form>
    </Box>
  );
}
