'use client';

import React, { useState, useCallback, use } from 'react';
import {
  AppBar,
  IconButton,
  Box,
  Button,
  Drawer,
  Divider,
  Link as MuiLink,
  List,
  ListItemButton,
  ListItemText,
  type SxProps,
  type Theme,
  MenuItem,
  Popover
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { usePathname } from 'next/navigation';
import { Menu as MenuIcon } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import Link from 'next/link';
import Sitemark from './SitemarkIcon';
import PopupState, { bindTrigger, bindPopover } from 'material-ui-popup-state';
import { type User } from '@supabase/supabase-js';
import SignOut from './SignOut';

const linkStyleDesktop: SxProps<Theme> = {
  fontWeight: 600,
  fontSize: '1.05rem',
  margin: '0 0.5rem',
  color: 'text.primary',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  borderRadius: '6px',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    textDecoration: 'none'
  },
  '&.active': {
    fontWeight: 700,
    color: 'primary.main',
    backgroundColor: 'rgba(25, 118, 210, 0.08)'
  }
};

interface HeaderProps {
  session: Promise<User | null>;
}

const Header: React.FC<HeaderProps> = ({ session }) => {
  const userData = use(session);

  const isLoggedIn = !!userData;

  const [drawerOpen, setDrawerOpen] = useState(false);

  const pathname = usePathname();

  const isActive = useCallback(
    (href: string) => {
      return pathname.startsWith(href);
    },
    [pathname]
  );

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const mobileMenuItems = [
    { href: '/protected', text: 'Protected' },
    { href: '/aichat', text: 'AI Chat' },
    { href: '/actionchat', text: 'Action Chat' }
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
      <Box
        sx={{
          p: 0.2,
          display: 'flex',
          alignItems: 'center',
          width: 'fit-content',
          mx: 'auto'
        }}
      >
        <MuiLink
          href="/"
          sx={{
            cursor: 'pointer',
            display: 'inline-block',
            textDecoration: 'none'
          }}
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
        {isLoggedIn && (
          <>
            <Divider component="li" />
            <ListItemButton>
              <ListItemText
                primary={<SignOut />}
                primaryTypographyProps={{
                  fontWeight: 600,
                  variant: 'h3'
                }}
              />
            </ListItemButton>
          </>
        )}
      </List>
    </Box>
  );

  const mobileAppBarContent = (
    <IconButton
      edge="end"
      aria-label="menu"
      onClick={handleDrawerToggle}
      sx={{
        position: 'fixed',
        top: 0,
        right: 16,
        bgcolor: 'rgba(0, 0, 0, 0.04)',
        borderRadius: '50%'
      }}
    >
      <MenuIcon sx={{ fontSize: '1.75rem' }} />
    </IconButton>
  );
  const appBarContent = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        pl: { md: 4, lg: 8 },
        margin: '0 auto'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flex: { md: 0, lg: 0, xl: 1 },
          mr: -2
        }}
      >
        <MuiLink
          href="/"
          sx={{
            padding: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            zIndex: 1,
            position: 'relative',
            '&:hover': { textDecoration: 'none' }
          }}
        >
          <Sitemark />
        </MuiLink>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flex: 1,
          justifyContent: {
            xs: 'none',
            sm: 'none',
            md: 'flex-end',
            lg: 'flex-end',
            xl: 'flex-end'
          }
        }}
      >
        <Button
          component={Link}
          href="/protected"
          prefetch={false}
          sx={linkStyleDesktop}
          className={isActive('/protected') ? 'active' : ''}
        >
          Protected
        </Button>

        <Button
          component={Link}
          href="/aichat"
          prefetch={false}
          sx={linkStyleDesktop}
          className={isActive('/aichat') ? 'active' : ''}
        >
          AI Chat
        </Button>

        <Button
          component={Link}
          href="/actionchat"
          prefetch={false}
          sx={linkStyleDesktop}
          className={isActive('/actionchat') ? 'active' : ''}
        >
          Action Chat
        </Button>

        {isLoggedIn ? (
          <PopupState variant="popover" popupId="profile-menu">
            {(popupState) => (
              <>
                <Button
                  {...bindTrigger(popupState)}
                  endIcon={<KeyboardArrowDownIcon />}
                  sx={linkStyleDesktop}
                >
                  Profile
                </Button>
                <Popover
                  {...bindPopover(popupState)}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left'
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left'
                  }}
                  disableScrollLock
                >
                  <Box sx={{ py: 1 }}>
                    <MenuItem component={Link} href="/profile">
                      Profile
                    </MenuItem>
                    <MenuItem>
                      <SignOut />
                    </MenuItem>
                  </Box>
                </Popover>
              </>
            )}
          </PopupState>
        ) : (
          <Button
            component={Link}
            href="/signin"
            prefetch={false}
            sx={linkStyleDesktop}
            className={isActive('/signin') ? 'active' : ''}
          >
            Sign in
          </Button>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      {/* AppBar for md and larger screens */}
      <AppBar
        position="sticky"
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(24px)',
          boxShadow:
            '0 0 1px rgba(85, 166, 246, 0.1), 1px 1.5px 2px -1px rgba(85, 166, 246, 0.15), 4px 4px 12px -2.5px rgba(85, 166, 246, 0.15)',
          display: { xs: 'none', sm: 'none', md: 'block' },
          borderBottom: '1px solid',
          borderColor: 'divider',
          width: '100%',
          height: '44px',
          p: '4px'
        }}
      >
        {appBarContent}
      </AppBar>
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
            width: 'fit-content'
          }
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Header;
