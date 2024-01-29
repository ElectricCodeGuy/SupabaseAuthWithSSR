'use client';
import React, { FC, useState } from 'react';
import { useRouter } from 'next/navigation';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import IconButton from '@mui/material/IconButton';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import TerminalIcon from '@mui/icons-material/Terminal';
import LockIcon from '@mui/icons-material/Lock'; // Icon for protected page
import SignOutButton from './SignOut';
import type { Session } from '@supabase/supabase-js';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

interface SidebarProps {
  session: Session | null;
}

const Sidebar: FC<SidebarProps> = ({ session }) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const router = useRouter();

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleNavigation = (link: string) => {
    setOpen(false);
    router.push(link);
  };

  return (
    <>
      {!open && (
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={handleDrawerToggle}
          sx={{
            position: 'fixed',
            zIndex: theme.zIndex.drawer + 1,
            left: theme.spacing(2),
            top: theme.spacing(2)
          }}
        >
          <MenuOutlinedIcon />
        </IconButton>
      )}

      <Drawer
        variant={isDesktop ? 'persistent' : 'temporary'}
        open={open}
        onClose={handleDrawerToggle}
        anchor="left"
        ModalProps={{
          keepMounted: true // Better open performance on mobile.
        }}
        PaperProps={{
          elevation: 3,
          style: {
            width: 250 // Adjust width as needed.
          }
        }}
      >
        <List>
          <ListItemButton onClick={handleDrawerToggle}>
            <ListItemIcon>
              <ChevronLeftIcon />
            </ListItemIcon>
            <ListItemText primary="Close" />
          </ListItemButton>

          <ListItemButton onClick={() => handleNavigation('/')}>
            <ListItemIcon>
              <HomeOutlinedIcon />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItemButton>

          {session ? (
            <ListItemButton onClick={() => handleNavigation('/protected')}>
              <ListItemIcon>
                <LockIcon />
              </ListItemIcon>
              <ListItemText primary="Protected Page" />
            </ListItemButton>
          ) : null}

          {!session && (
            <ListItemButton onClick={() => handleNavigation('/auth/signin')}>
              <ListItemIcon>
                <TerminalIcon />
              </ListItemIcon>
              <ListItemText primary="Sign in" />
            </ListItemButton>
          )}

          {session && (
            <ListItem>
              <SignOutButton />
            </ListItem>
          )}
        </List>
      </Drawer>
    </>
  );
};

export default Sidebar;
