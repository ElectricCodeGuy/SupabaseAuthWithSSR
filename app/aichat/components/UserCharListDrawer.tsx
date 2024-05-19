/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import React, { type FC, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { deleteChatData } from '../actions';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  Tooltip,
  Divider,
  Link as MuiLink,
  Button,
  useTheme,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  useMediaQuery,
  Chip
} from '@mui/material';
import { Delete as DeleteIcon, Menu as MenuIcon } from '@mui/icons-material';
import { format } from 'date-fns';

type ChatPreview = {
  id: string;
  firstMessage: string;
  created_at: string;
};

type CombinedDrawerProps = {
  session: User | null;
  chatPreviews: ChatPreview[];
  userId: string;
  chatId?: string;
};

const CombinedDrawer: FC<CombinedDrawerProps> = ({
  chatPreviews,
  userId,
  chatId
}) => {
  const router = useRouter();
  const theme = useTheme();
  const isSmOrXs = useMediaQuery(theme.breakpoints.down('md'));

  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const selectedStyle = {
    backgroundColor: theme.palette.action.selected,
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    borderRadius: '0 4px 4px 0'
  };

  const listItemButtonStyle = {
    fontSize: '0.9rem'
  };

  const truncateMessage = (message: string, length: number) => {
    return message.length > length
      ? `${message.substring(0, length)}...`
      : message;
  };

  const isSelected = (id: string) => id === chatId;
  const handleDeleteClick = (id: string) => {
    setChatToDelete(id);
    setDeleteConfirmationOpen(true);
  };

  const handleDeleteConfirmation = async () => {
    if (chatToDelete) {
      try {
        await deleteChatData(userId, chatToDelete);
        if (chatToDelete === chatId) {
          const newHref = '/aichat';
          router.replace(newHref, { scroll: false });
        }
      } catch (error) {
        console.error('Failed to delete the chat:', error);
      }
    }
    setDeleteConfirmationOpen(false);
    setChatToDelete(null);
  };

  const drawerWidth = 300;
  const memoizedChatListItems = useMemo(() => {
    return chatPreviews.map(({ id, firstMessage, created_at }) => {
      const tooltipTitle = firstMessage || 'No messages yet';
      const truncatedMessage = truncateMessage(
        firstMessage || `Chat ID: ${id}`,
        24
      );
      const formattedDate = format(new Date(created_at), 'yyyy-MM-dd');

      return (
        <Tooltip key={id} title={tooltipTitle} placement="left" arrow>
          <ListItem
            disablePadding
            onMouseEnter={() => setHoveredChatId(id)}
            onMouseLeave={() => setHoveredChatId(null)}
            sx={{ position: 'relative' }}
          >
            <MuiLink
              component="button"
              underline="none"
              sx={{ flexGrow: 1 }}
              onClick={() => {
                const newPathname = `/aichat/${id}`;
                router.replace(newPathname, { scroll: false });
              }}
            >
              <ListItemButton
                sx={{
                  ...(isSelected(id) ? selectedStyle : {}),
                  ...listItemButtonStyle
                }}
              >
                {truncatedMessage}
                <Chip
                  label={formattedDate}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    right: 0,
                    transform: 'translateY(-50%)',
                    marginLeft: 1,
                    marginRight: 2,
                    fontSize: '0.7rem'
                  }}
                />
              </ListItemButton>
            </MuiLink>
            {hoveredChatId === id && (
              <IconButton
                onClick={() => handleDeleteClick(id)}
                size="small"
                sx={{ padding: '2px', position: 'absolute', right: 0 }}
              >
                <DeleteIcon fontSize="inherit" />
              </IconButton>
            )}
          </ListItem>
        </Tooltip>
      );
    });
  }, [chatPreviews, chatId, hoveredChatId, router]);

  return (
    <>
      {isSmOrXs && (
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={() => setDrawerOpen(true)}
          sx={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: theme.zIndex.drawer + 2
          }}
        >
          <MenuIcon />
        </IconButton>
      )}
      <Drawer
        variant={isSmOrXs ? 'temporary' : 'permanent'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        anchor="right"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box'
          }
        }}
        ModalProps={{
          keepMounted: true
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}
        >
          <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
            <ListItem
              key="newChat"
              disablePadding
              sx={{ width: '100%', padding: '8px 16px' }}
            >
              <MuiLink
                href={'/aichat'}
                underline="none"
                sx={{ width: '100%', display: 'block' }}
              >
                <Button variant="outlined" fullWidth>
                  New Chat
                </Button>
              </MuiLink>
            </ListItem>
            <Divider />
            <List>{memoizedChatListItems}</List>
          </Box>
          <Box>
            <Divider />
            <List>
              {[
                { href: '/', label: 'Home' },
                { href: '/protected', label: 'Account' }
              ].map((item, index) => (
                <ListItem key={index} disablePadding>
                  <MuiLink href={item.href}>
                    <ListItemButton>{item.label}</ListItemButton>
                  </MuiLink>
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
      </Drawer>
      <Dialog
        open={deleteConfirmationOpen}
        onClose={() => setDeleteConfirmationOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this chat?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmationOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirmation} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CombinedDrawer;
