'use client';
import React, { type FC, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { deleteChatData } from '../actions';
import useSWRImmutable from 'swr/immutable';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  Tooltip,
  Divider,
  Button,
  useTheme,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Chip,
  SwipeableDrawer,
  Drawer,
  CircularProgress
} from '@mui/material';
import { Delete as DeleteIcon, Menu as MenuIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { fetchMoreChatPreviews, ChatPreview } from '../actions';
import Link from 'next/link';

type CombinedDrawerProps = {
  chatPreviews: ChatPreview[];
  chatId?: string;
};

const CombinedDrawer: FC<CombinedDrawerProps> = ({
  chatPreviews: initialChatPreviews,
  chatId
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();

  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [offset, setOffset] = useState(60);
  const [allChatPreviews, setAllChatPreviews] =
    useState<ChatPreview[]>(initialChatPreviews);
  // Fetches more chat previews when the offset changes
  const {
    data: moreChatPreviews,
    isValidating,
    mutate
  } = useSWRImmutable(
    offset > 30 ? [offset] : null,
    ([offset]) => fetchMoreChatPreviews(offset),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );
  // Handles loading more chat previews
  const handleLoadMore = async () => {
    const newOffset = offset + 30;
    setOffset(newOffset);
    await mutate();
    if (moreChatPreviews) {
      setAllChatPreviews((prevPreviews) => [
        ...prevPreviews,
        ...moreChatPreviews
      ]);
    }
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
        await deleteChatData(chatToDelete);
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

  const drawerWidth = 350;
  const modelType = searchParams.get('modeltype') || 'standart';
  const selectedOption =
    searchParams.get('modelselected') || 'gpt-3.5-turbo-1106';

  // Renders the list of chat previews
  const chatListItems = allChatPreviews.map(
    ({ id, firstMessage, created_at }) => {
      const tooltipTitle = firstMessage || 'No messages yet';
      const truncatedMessage = truncateMessage(
        firstMessage || `Chat ID: ${id}`,
        24
      );
      const formattedDate = format(new Date(created_at), 'yyyy-MM-dd');

      const selectedStyle = isSelected(id)
        ? {
            backgroundColor: theme.palette.action.selected,
            borderLeft: `4px solid ${theme.palette.primary.main}`,
            borderRadius: '0 4px 4px 0'
          }
        : {};

      return (
        <React.Fragment key={id}>
          <Tooltip title={tooltipTitle} placement="left" arrow>
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                href={`/aichat/${id}?modeltype=${modelType}&modelselected=${selectedOption}`}
                prefetch={false}
                onMouseEnter={() => {
                  router.prefetch(
                    `/aichat/${id}?modeltype=${modelType}&modelselected=${selectedOption}`
                  );
                }}
                sx={{
                  fontSize: '0.9rem',
                  ...selectedStyle,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  position: 'relative'
                }}
              >
                {truncatedMessage}
                <Chip
                  label={formattedDate}
                  size="small"
                  sx={{
                    fontSize: '0.7rem'
                  }}
                />
                {isSelected(id) && (
                  <IconButton
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteClick(id);
                    }}
                    size="small"
                    sx={{
                      padding: '2px',
                      position: 'absolute',
                      right: 0,
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}
                  >
                    <DeleteIcon fontSize="inherit" />
                  </IconButton>
                )}
              </ListItemButton>
            </ListItem>
          </Tooltip>
          <Divider />
        </React.Fragment>
      );
    }
  );

  return (
    <>
      <IconButton
        edge="start"
        color="inherit"
        aria-label="menu"
        onClick={() => setDrawerOpen(true)}
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: theme.zIndex.drawer + 2,
          display: {
            xs: 'block',
            sm: 'block',
            md: 'none',
            lg: 'none',
            xl: 'none'
          }
        }}
      >
        <MenuIcon />
      </IconButton>
      <Box
        sx={{
          display: {
            xs: 'none',
            sm: 'none',
            md: 'block',
            lg: 'block',
            xl: 'block'
          }
        }}
      >
        <Drawer
          variant="permanent"
          anchor="right"
          sx={{
            width: drawerWidth,
            overflowx: 'hidden',
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box'
            }
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
                component={Link}
                href={`/aichat?modeltype=${searchParams.get('modeltype') ?? 'standart'}&modelselected=${searchParams.get('modelselected') ?? 'gpt-3.5-turbo-1106'}`}
                prefetch={false}
                key="newChat"
                aria-label="New Chat"
                disablePadding
                sx={{ padding: 0.2 }}
              >
                <ListItemButton
                  sx={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}
                >
                  New Chat
                </ListItemButton>
              </ListItem>
              <Divider />
              <List>{chatListItems}</List>
              {allChatPreviews.length % 30 === 0 && (
                <ListItem component="form" action={handleLoadMore}>
                  <Button type="submit" fullWidth disabled={isValidating}>
                    {isValidating ? (
                      <CircularProgress size={24} />
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </ListItem>
              )}
            </Box>
            <Box>
              <Divider />
              <List>
                {[
                  { href: '/', label: 'Home' },
                  { href: '/protected', label: 'Account' }
                ].map((item, index) => (
                  <React.Fragment key={index}>
                    <ListItem disablePadding>
                      <Link
                        href={item.href}
                        prefetch={false}
                        onMouseEnter={() => {
                          router.prefetch(item.href);
                        }}
                      >
                        <ListItemButton>{item.label}</ListItemButton>
                      </Link>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </Box>
          </Box>
        </Drawer>
      </Box>
      <Box
        sx={{
          display: {
            xs: 'block',
            sm: 'block',
            md: 'none',
            lg: 'none',
            xl: 'none'
          }
        }}
      >
        <SwipeableDrawer
          anchor="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onOpen={() => setDrawerOpen(true)}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box'
            }
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
                component={Link}
                href={`/aichat?modeltype=${searchParams.get('modeltype') ?? 'standart'}&modelselected=${searchParams.get('modelselected') ?? 'gpt-3.5-turbo-1106'}`}
                prefetch={false}
                key="newChat"
                disablePadding
                sx={{ padding: 1, alignContent: 'center' }}
              >
                <ListItemButton
                  sx={{
                    alignContent: 'center'
                  }}
                >
                  New Chat
                </ListItemButton>
              </ListItem>
              <Divider />
              <List>{chatListItems}</List>
              {allChatPreviews.length % 30 === 0 && (
                <ListItem component="form" action={handleLoadMore}>
                  <Button type="submit" fullWidth disabled={isValidating}>
                    {isValidating ? (
                      <CircularProgress size={24} />
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </ListItem>
              )}
            </Box>
          </Box>
        </SwipeableDrawer>
      </Box>
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
