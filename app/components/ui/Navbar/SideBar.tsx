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
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Link from 'next/link';

interface SidebarProps {
  session: User | null;
}

const Sidebar: FC<SidebarProps> = ({ session }) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

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
          keepMounted: true
        }}
        PaperProps={{
          elevation: 3,
          style: {
            width: 250 // Increased width to accommodate the close button
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
            <ListItemButton onClick={handleDrawerToggle}>
              <ListItemIcon>
                <HomeOutlinedIcon />
              </ListItemIcon>
              <ListItemText primary="Home" />
            </ListItemButton>
          </Link>

          {!session && (
            <Link href="/auth" passHref>
              <ListItemButton onClick={handleDrawerToggle}>
                <ListItemIcon>
                  <TerminalIcon />
                </ListItemIcon>
                <ListItemText primary="Sign in" />
              </ListItemButton>
            </Link>
          )}

          <Link href="/protected" passHref>
            <ListItemButton onClick={handleDrawerToggle} disabled={!session}>
              <ListItemIcon>
                <LockOpenIcon />
              </ListItemIcon>
              <ListItemText primary="Protected" />
            </ListItemButton>
          </Link>

          {/* Sign out button if session exists */}
          <ListItem>{session ? <SignOutButton /> : null}</ListItem>
        </List>
      </Drawer>
    </>
  );
};

export default Sidebar;
