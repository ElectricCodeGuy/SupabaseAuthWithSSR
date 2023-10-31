// pages/auth/[authState].tsx
import React from 'react';
import AuthForm from '../AuthForm'; // Importing the AuthForm component
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Link from '@mui/material/Link';
import Drawer from '@mui/material/Drawer';

type IdAuthType = 'signin' | 'signup' | 'reset';

const DrawerList = () => (
  <List>
    <Link href="/auth/signin">
      <ListItemButton>
        <ListItemText primary="Sign In" />
      </ListItemButton>
    </Link>
    <Link href="/auth/signup">
      <ListItemButton>
        <ListItemText primary="Sign Up" />
      </ListItemButton>
    </Link>
    <Link href="/auth/reset">
      <ListItemButton>
        <ListItemText primary="Reset Password" />
      </ListItemButton>
    </Link>
  </List>
);

interface PageProps {
  params: {
    id: IdAuthType;
  };
}

const Page: React.FC<PageProps> = ({ params }) => {
  const { id = 'signin' } = params;

  return (
    <Box>
      <Box sx={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <AuthForm authState={id} />
        </Box>
      </Box>
      <Drawer
        variant="permanent"
        anchor="right"
        PaperProps={{
          elevation: 3,
          style: {
            background: 'transparent',
            border: 'none'
          }
        }}
      >
        <DrawerList />
      </Drawer>
    </Box>
  );
};

export default Page;
