'use client';
import React, { FC, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  AppBar,
  Box,
  Button,
  IconButton,
  MenuItem,
  Toolbar,
  styled,
  Avatar,
  Menu,
  Slide,
  useScrollTrigger
} from '@mui/material';
import SignOutButton from './SignOut';
import Sitemark from './SitemarkIcon';

interface AppBarProps {
  session: boolean | null;
}

const StyledLink = styled(Link)(({ theme }) => ({
  fontWeight: 500,
  fontSize: '1rem',
  margin: theme.spacing(0, 0.8),
  borderRadius: theme.shape.borderRadius,
  transition: 'color 0.3s, background-color 0.3s',
  color: theme.palette.text.primary,
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline'
  },
  '&.active': {
    fontWeight: 700,
    textDecoration: 'underline'
  }
}));

const AppBarComponent: FC<AppBarProps> = ({ session }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const pathname = usePathname();

  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 50
  });

  const [showAppBar, setShowAppBar] = useState(!trigger);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleMouseMove = (event: MouseEvent) => {
      if (pathname === '/aichat' || pathname === '/actionchat') {
        if (event.clientY <= 50) {
          setShowAppBar(true);
        } else {
          timeoutId = setTimeout(() => {
            setShowAppBar(false);
          }, 250);
        }
      } else {
        if (event.clientY <= 50) {
          setShowAppBar(true);
        } else {
          setShowAppBar(!trigger);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeoutId);
    };
  }, [trigger, pathname]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const isSelected = (path: string) => pathname === path;

  return (
    <Slide appear={false} direction="down" in={showAppBar}>
      <AppBar
        position="fixed"
        sx={{
          bgcolor: 'transparent',
          boxShadow: 'none',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Toolbar
          variant="dense"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '999px',
            bgcolor: 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(24px)',
            maxWidth: '100%',
            width: { lg: 800, md: 900, sm: 1200, xs: '100%' },
            mx: 'auto',
            zIndex: 1202,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow:
              '0 0 1px rgba(85, 166, 246, 0.1), 1px 1.5px 2px -1px rgba(85, 166, 246, 0.15), 4px 4px 12px -2.5px rgba(85, 166, 246, 0.15)'
          }}
        >
          <Box
            sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', px: 0 }}
          >
            <Link href="/" passHref>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  textDecoration: 'none'
                }}
              >
                <Sitemark />
              </Box>
            </Link>
            <Box sx={{ display: 'flex' }}>
              <StyledLink
                href="/protected"
                className={isSelected('/protected') ? 'active' : ''}
              >
                Protected
              </StyledLink>
              <StyledLink
                href="/aichat"
                className={isSelected('/aichat') ? 'active' : ''}
                sx={{ display: { xs: 'none', sm: 'none', md: 'block' } }}
              >
                AI Chat
              </StyledLink>
              <StyledLink
                href="/actionchat"
                className={isSelected('/actionchat') ? 'active' : ''}
                sx={{ display: { xs: 'none', sm: 'none', md: 'block' } }}
              >
                Action Chat
              </StyledLink>
            </Box>
          </Box>
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'center'
            }}
          >
            {session ? (
              <IconButton onClick={handleMenuClick}>
                <Avatar src="/path-to-default-avatar.jpg" alt="User" />
              </IconButton>
            ) : (
              <Link href="/auth" passHref>
                <Button color="primary" variant="contained" size="small">
                  Sign in
                </Button>
              </Link>
            )}
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            onClick={handleClose}
          >
            <MenuItem component={Link} href="/profile">
              Profile
            </MenuItem>
            <MenuItem
              component={Link}
              href="/aichat"
              sx={{ display: { md: 'none' } }}
            >
              AI Chat
            </MenuItem>
            <MenuItem
              component={Link}
              href="/actionchat"
              sx={{ display: { md: 'none' } }}
            >
              Action Chat
            </MenuItem>
            <MenuItem>
              <SignOutButton />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
    </Slide>
  );
};

export default AppBarComponent;
