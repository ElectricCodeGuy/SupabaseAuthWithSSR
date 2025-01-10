'use client';
import React, { type FC, useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { deleteChatData } from '../actions';
import useSWRInfinite from 'swr/infinite';
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
};

const CombinedDrawer: FC<CombinedDrawerProps> = ({
  chatPreviews: initialChatPreviews
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const currentChatId = (params?.id as string) || ''; // Extract and type cast id from params
  const theme = useTheme();

  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetches more chat previews when the offset changes
  const {
    data: allChatPreviews,
    isValidating,
    mutate: mutateChatPreviews,
    size,
    setSize
  } = useSWRInfinite(
    (index) => [`chatPreviews`, index],
    async ([_, index]) => {
      const newOffset = index * 30;
      return fetchMoreChatPreviews(newOffset);
    },
    {
      fallbackData: [initialChatPreviews],
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateFirstPage: false
    }
  );

  const loadMore = () => {
    if (!isValidating) {
      setSize(size + 1);
    }
  };

  const handleDeleteClick = (id: string) => {
    setChatToDelete(id);
    setDeleteConfirmationOpen(true);
  };

  const handleDeleteConfirmation = async () => {
    if (chatToDelete) {
      try {
        await deleteChatData(chatToDelete);
        await mutateChatPreviews();
        if (chatToDelete === currentChatId) {
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
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PP');
  };

  // Renders the list of chat previews
  const chatListItems = (allChatPreviews ?? []).flatMap((page) =>
    page.map(({ id, firstMessage, created_at }) => {
      const tooltipTitle = firstMessage || 'No messages yet';

      return (
        <React.Fragment key={id}>
          <Tooltip
            title={tooltipTitle}
            placement="left"
            arrow
            sx={{ maxHeight: 100 }}
          >
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
                fontSize: '0.95rem',
                backgroundColor:
                  currentChatId === id ? 'rgba(0, 0, 0, 0.1)' : 'inherit',
                paddingRight: '25px',
                position: 'relative',
                '&::after': {
                  content: 'attr(data-truncated-message)',
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  '@media (max-width: 600px)': {
                    maxWidth: 'calc(100% - 50px)'
                  },
                  '@media (min-width: 601px)': {
                    maxWidth: 'calc(100% - 70px)'
                  }
                },
                // Show delete button on hover
                '& .delete-button': {
                  display: 'none'
                },
                '&:hover .delete-button': {
                  display: 'flex'
                }
              }}
              data-truncated-message={firstMessage}
            >
              <Chip
                label={formatDate(created_at)}
                size="small"
                sx={{
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  right: {
                    xs: '4px',
                    sm: '4px',
                    md: '20px'
                  },
                  fontSize: '0.6rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  height: '20px'
                }}
              />
              <IconButton
                className="delete-button"
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteClick(id);
                }}
                size="small"
                sx={{
                  padding: '2px',
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'error.main',
                  '&:hover': {
                    backgroundColor: 'error.light',
                    color: 'error.contrastText'
                  }
                }}
              >
                <DeleteIcon fontSize="inherit" />
              </IconButton>
            </ListItemButton>
          </Tooltip>
          <Divider />
        </React.Fragment>
      );
    })
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
          anchor="left"
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
              <Button
                fullWidth
                component={Link}
                href={`/aichat?modeltype=${searchParams.get('modeltype') ?? 'standart'}&modelselected=${searchParams.get('modelselected') ?? 'gpt-3.5-turbo-1106'}`}
                prefetch={false}
                key="newChat"
                aria-label="New Chat"
                sx={{
                  fontSize: '1rem',
                  p: 0.75,
                  borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
                }}
              >
                New Chat
              </Button>

              <List>{chatListItems}</List>
              {(allChatPreviews?.[allChatPreviews.length - 1]?.length ?? 0) ===
                30 && (
                <ListItem component="div">
                  <Button onClick={loadMore} disabled={isValidating}>
                    {isValidating ? (
                      <CircularProgress size={24} />
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </ListItem>
              )}
            </Box>

            <Divider />

            {[
              { href: '/', label: 'Home' },
              { href: '/protected', label: 'Account' }
            ].map((item, index) => (
              <React.Fragment key={index}>
                <Button
                  fullWidth
                  component={Link}
                  href={item.href}
                  prefetch={false}
                  onMouseEnter={() => {
                    router.prefetch(item.href);
                  }}
                  sx={{
                    p: 1
                  }}
                >
                  {item.label}
                </Button>

                <Divider />
              </React.Fragment>
            ))}
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
          anchor="left"
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
          {(allChatPreviews?.[allChatPreviews.length - 1]?.length ?? 0) ===
            30 && (
            <ListItem component="div">
              <Button onClick={loadMore} disabled={isValidating}>
                {isValidating ? <CircularProgress size={24} /> : 'Load More'}
              </Button>
            </ListItem>
          )}
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
