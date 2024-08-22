'use client';
import React, { FC, useState } from 'react';
import { usePathname } from 'next/navigation';
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
import Link from 'next/link';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';

interface SidebarProps {
  session: boolean | null;
}

const Sidebar: FC<SidebarProps> = ({ session }) => {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const isSelected = (path: string) => pathname === path;

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
      >
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <List>
            <ListItemButton onClick={handleDrawerToggle}>
              <ListItemIcon>
                <ChevronLeftIcon />
              </ListItemIcon>
              <ListItemText primary="Close" />
            </ListItemButton>

            <Link href="/" passHref>
              <ListItemButton selected={isSelected('/')}>
                <ListItemIcon>
                  <HomeOutlinedIcon />
                </ListItemIcon>
                <ListItemText primary="Home" />
              </ListItemButton>
            </Link>

            {!session && (
              <Link href="/auth" passHref>
                <ListItemButton selected={isSelected('/auth')}>
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
                  <ListItemButton selected={isSelected('/protected')}>
                    <ListItemIcon>
                      <LockOpenIcon />
                    </ListItemIcon>
                    <ListItemText primary="Protected" />
                  </ListItemButton>
                </Link>

                <Link href="/aichat" passHref>
                  <ListItemButton selected={isSelected('/aichat')}>
                    <ListItemIcon>
                      <LockOpenIcon />
                    </ListItemIcon>
                    <ListItemText primary="Ai Chat" />
                  </ListItemButton>
                </Link>

                <Link href="/actionchat" passHref>
                  <ListItemButton selected={isSelected('/actionchat')}>
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
          </List>
        </Box>

        <Box sx={{ mt: 'auto' }}>
          <Divider />
          <List>
            <ListItem sx={{ justifyContent: 'center' }}>
              {session ? <SignOutButton /> : <Box height={48} />}
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Sidebar;
