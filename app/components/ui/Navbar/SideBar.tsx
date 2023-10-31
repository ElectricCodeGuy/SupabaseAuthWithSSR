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
import TerminalIcon from '@mui/icons-material/Terminal';
import Darkmode from './darkmode';
import SignOutButton from './SignOut';
import type { Session } from '@supabase/supabase-js';

interface SidebarProps {
  session: Session | null;
}

const Sidebar: FC<SidebarProps> = ({ session }) => {
  const [open, setOpen] = useState(true); // Initial state is set to true for the drawer to be open

  const router = useRouter();

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleNavigation = (link: string) => {
    router.push(link);
  };

  return (
    <>
      <IconButton
        edge="start"
        color="inherit"
        onClick={handleDrawerToggle}
        sx={{ position: 'fixed', zIndex: 1199, left: '20px' }} // Added left property
      >
        <MenuOutlinedIcon />
      </IconButton>

      <Drawer
        variant="persistent"
        open={open}
        anchor="left"
        PaperProps={{
          elevation: 3, // Remove shadow
          style: {
            border: 'none', // Remove border
            width: '200px' // Added width property
          }
        }}
      >
        <List>
          <ListItemButton onClick={handleDrawerToggle}>
            <ListItemIcon>
              <MenuOutlinedIcon />
            </ListItemIcon>
          </ListItemButton>

          <ListItemButton onClick={() => handleNavigation('/')}>
            <ListItemIcon>
              <HomeOutlinedIcon />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItemButton>

          {!session && (
            <ListItemButton onClick={() => handleNavigation('/auth/signin')}>
              <ListItemIcon>
                <TerminalIcon />
              </ListItemIcon>
              <ListItemText primary="Sign in" />
            </ListItemButton>
          )}

          <ListItem>
            <ListItemIcon>
              <Darkmode />
            </ListItemIcon>
          </ListItem>

          <ListItem>{session ? <SignOutButton /> : null}</ListItem>
        </List>
      </Drawer>
    </>
  );
};

export default Sidebar;
