'use client';
import React, { FC, useState } from 'react';
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
import LockOpenIcon from '@mui/icons-material/LockOpen';
import SignOutButton from './SignOut';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';

interface SidebarProps {
  session: User | null;
}

const Sidebar: FC<SidebarProps> = ({ session }) => {
  const [open, setOpen] = useState(true);

  const handleDrawerToggle = () => {
    setOpen(!open);
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
            left: 20,
            top: 20
          }}
        >
          <MenuOutlinedIcon />
        </IconButton>
      )}

      <Drawer
        variant={'persistent'}
        open={open}
        onClose={handleDrawerToggle}
        anchor="left"
        ModalProps={{
          keepMounted: true,
          BackdropProps: {
            style: { backgroundColor: 'transparent' }
          }
        }}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          '& .MuiDrawer-paper': {
            width: 250
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

          <Link href="/" passHref>
            <ListItemButton>
              <ListItemIcon>
                <HomeOutlinedIcon />
              </ListItemIcon>
              <ListItemText primary="Home" />
            </ListItemButton>
          </Link>

          {!session && (
            <Link href="/auth" passHref>
              <ListItemButton>
                <ListItemIcon>
                  <TerminalIcon />
                </ListItemIcon>
                <ListItemText primary="Sign in" />
              </ListItemButton>
            </Link>
          )}

          {session ? (
            <>
              <Link href="/protected" passHref>
                <ListItemButton>
                  <ListItemIcon>
                    <LockOpenIcon />
                  </ListItemIcon>
                  <ListItemText primary="Protected" />
                </ListItemButton>
              </Link>

              <Link href="/aichat" passHref>
                <ListItemButton>
                  <ListItemIcon>
                    <LockOpenIcon />
                  </ListItemIcon>
                  <ListItemText primary="Ai Chat" />
                </ListItemButton>
              </Link>

              <Link href="/actionchat" passHref>
                <ListItemButton>
                  <ListItemIcon>
                    <LockOpenIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <>
                        Action Chat{' '}
                        <Chip label="New" color="primary" size="small" />
                      </>
                    }
                  />
                </ListItemButton>
              </Link>
            </>
          ) : (
            <>
              <ListItemButton disabled>
                <ListItemIcon>
                  <LockOpenIcon />
                </ListItemIcon>
                <ListItemText primary="Protected" />
              </ListItemButton>

              <ListItemButton disabled>
                <ListItemIcon>
                  <LockOpenIcon />
                </ListItemIcon>
                <ListItemText primary="Ai Chat" />
              </ListItemButton>

              <ListItemButton disabled>
                <ListItemIcon>
                  <LockOpenIcon />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <>
                      Action Chat{' '}
                      <Chip label="New" color="primary" size="small" />
                    </>
                  }
                />
              </ListItemButton>
            </>
          )}

          {/* Add a divider and sign out button if session exists */}
          {session && (
            <>
              <Divider />
              <ListItem sx={{ justifyContent: 'center', mt: 'auto' }}>
                <SignOutButton />
              </ListItem>
            </>
          )}
        </List>
      </Drawer>
    </>
  );
};

export default Sidebar;
