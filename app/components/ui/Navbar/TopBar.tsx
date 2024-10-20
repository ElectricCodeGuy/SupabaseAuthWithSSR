'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Slide,
  Button,
  Drawer,
  Divider,
  Link as MuiLink,
  List,
  ListItemButton,
  ListItemText,
  type SxProps,
  type Theme,
  Avatar,
  Menu,
  MenuItem
} from '@mui/material';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu as MenuIcon } from '@mui/icons-material';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import CloseIcon from '@mui/icons-material/Close';
import Sitemark from './SitemarkIcon';
import SignOutButton from './SignOut';

const linkStyleDesktop: SxProps<Theme> = {
  fontWeight: 500,
  fontSize: '1.05rem',
  margin: '0 0.5rem',
  borderRadius: '999px',
  transition: 'color 0.3s, background-color 0.3s',
  color: 'black',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  '&:hover': {
    textDecoration: 'underline'
  },
  '&.active': {
    fontWeight: 700,
    textDecoration: 'underline'
  }
};

interface AppBarProps {
  session: boolean | null;
}

const AppBarComponent: React.FC<AppBarProps> = ({ session }) => {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 50
  });

  const [showAppBar, setShowAppBar] = useState(!trigger);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleMouseMove = (event: MouseEvent) => {
      if (window.innerWidth >= 900) {
        const appBarWidth = getAppBarWidth();
        const appBarLeft = (window.innerWidth - appBarWidth) / 2;
        const appBarRight = appBarLeft + appBarWidth;

        const isWithinAppBarWidth =
          event.clientX >= appBarLeft && event.clientX <= appBarRight;

        if (
          pathname.startsWith('/aichat') ||
          pathname.startsWith('/actionchat')
        ) {
          if (event.clientY <= 50 && isWithinAppBarWidth) {
            setShowAppBar(true);
          } else {
            timeoutId = setTimeout(() => {
              setShowAppBar(false);
            }, 100);
          }
        } else {
          if (event.clientY <= 50 && isWithinAppBarWidth) {
            setShowAppBar(true);
          } else {
            timeoutId = setTimeout(() => {
              setShowAppBar(!trigger);
            }, 100);
          }
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeoutId);
    };
  }, [trigger, pathname]);

  const isActive = useCallback(
    (href: string) => {
      return pathname.startsWith(href);
    },
    [pathname]
  );

  const getAppBarWidth = () => {
    const windowWidth = window.innerWidth;
    let baseWidth;
    if (windowWidth >= 1200)
      baseWidth = 800; // lg
    else if (windowWidth >= 900)
      baseWidth = 900; // md
    else if (windowWidth >= 600)
      baseWidth = 1200; // sm
    else baseWidth = windowWidth; // xs

    return baseWidth * 1.1;
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const mobileMenuItems = [
    { href: '/protected', text: 'Protected' },
    { href: '/aichat', text: 'AI Chat' },
    { href: '/actionchat', text: 'Action Chat' },
    {
      href: session ? '/profile' : '/signin',
      text: session ? 'Profile' : 'Sign in'
    }
  ];

  const drawer = (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowX: 'hidden'
      }}
      role="presentation"
      onClick={handleDrawerToggle}
    >
      <Button
        onClick={() => setDrawerOpen(false)}
        size="large"
        sx={{
          position: 'absolute',
          top: 2,
          right: 2,
          minWidth: 'unset'
        }}
      >
        <CloseIcon />
      </Button>
      <Box sx={{ p: 0.2, display: 'flex', alignItems: 'center' }}>
        <MuiLink
          title="Home"
          href="/"
          sx={{ cursor: 'pointer', display: 'inline-block' }}
        >
          <Sitemark />
        </MuiLink>
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1, overflowY: 'auto', py: 0, width: '100%' }}>
        {mobileMenuItems.map((item, index) => (
          <React.Fragment key={index}>
            <ListItemButton
              component={Link}
              prefetch={true}
              title={item.text}
              href={item.href}
              sx={{
                py: 1.5,
                bgcolor: isActive(item.href) ? 'action.selected' : 'inherit',
                '&:hover': {
                  bgcolor: isActive(item.href)
                    ? 'action.selected'
                    : 'action.hover'
                }
              }}
            >
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: 600,
                  variant: 'h3'
                }}
              />
            </ListItemButton>
            {index < mobileMenuItems.length - 1 && <Divider component="li" />}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );

  const mobileAppBarContent = (
    <>
      <IconButton
        edge="end"
        aria-label="menu"
        onClick={handleDrawerToggle}
        sx={{
          position: 'fixed',
          top: 0,
          left: 4,
          bgcolor: 'rgba(0, 0, 0, 0.04)',
          borderRadius: '50%'
        }}
      >
        <MenuIcon sx={{ fontSize: '1.75rem' }} />
      </IconButton>
    </>
  );

  const appBarContent = (
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
        sx={{
          display: 'flex',
          alignItems: 'center',
          ml: {
            xs: '-10px',
            sm: '-10px',
            md: '-18px',
            lg: '-18px',
            xl: '-18px'
          },
          px: 0
        }}
      >
        <MuiLink
          href="/"
          sx={{
            cursor: 'pointer',
            display: 'inline-block',
            pr: {
              xs: 2,
              sm: 2,
              md: 4,
              lg: 4,
              xl: 4
            }
          }}
        >
          <Sitemark />
        </MuiLink>
        <Box sx={{ display: { xs: 'none', sm: 'flex', md: 'flex' } }}>
          <MuiLink
            component={Link}
            prefetch={true}
            title="Protected"
            href="/protected"
            color="inherit"
            className={isActive('/protected') ? 'active' : ''}
            sx={linkStyleDesktop}
          >
            Protected
          </MuiLink>
          <MuiLink
            component={Link}
            prefetch={true}
            title="AI Chat"
            href="/aichat"
            color="inherit"
            className={isActive('/aichat') ? 'active' : ''}
            sx={linkStyleDesktop}
          >
            AI Chat
          </MuiLink>
          <MuiLink
            component={Link}
            prefetch={true}
            title="Action Chat"
            href="/actionchat"
            color="inherit"
            className={isActive('/actionchat') ? 'active' : ''}
            sx={linkStyleDesktop}
          >
            Action Chat
          </MuiLink>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {session ? (
          <IconButton onClick={handleMenuClick} size="small">
            <Avatar alt="User" sizes="small" />
          </IconButton>
        ) : (
          <Button
            component={Link}
            prefetch={true}
            href="/signin"
            color="primary"
            variant="contained"
            size="small"
          >
            Sign in
          </Button>
        )}
      </Box>
    </Toolbar>
  );

  return (
    <>
      <Slide appear={false} direction="down" in={showAppBar}>
        <AppBar
          position="fixed"
          sx={{
            bgcolor: 'transparent',
            boxShadow: 'none',
            left: 0,
            right: 0,
            display: { xs: 'none', sm: 'none', md: 'flex' },
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {appBarContent}
        </AppBar>
      </Slide>

      <AppBar
        position="fixed"
        sx={{
          bgcolor: 'transparent',
          boxShadow: 'none',
          left: 0,
          right: 0,
          display: { xs: 'flex', sm: 'flex', md: 'none' },
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {mobileAppBarContent}
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true
        }}
        sx={{
          display: { xs: 'block', sm: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: '100%'
          }
        }}
      >
        {drawer}
      </Drawer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        onClick={handleClose}
      >
        <MenuItem component={Link} prefetch={true} href="/profile">
          Profile
        </MenuItem>
        <MenuItem
          component={Link}
          prefetch={true}
          href="/aichat"
          sx={{ display: { md: 'none' } }}
        >
          AI Chat
        </MenuItem>
        <MenuItem
          component={Link}
          prefetch={true}
          href="/actionchat"
          sx={{ display: { md: 'none' } }}
        >
          Action Chat
        </MenuItem>
        <MenuItem>
          <SignOutButton />
        </MenuItem>
      </Menu>
    </>
  );
};

export default AppBarComponent;
