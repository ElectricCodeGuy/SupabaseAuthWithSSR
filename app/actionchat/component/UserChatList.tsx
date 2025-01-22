'use client';
import React, {
  type FC,
  useState,
  memo,
  useCallback,
  useMemo,
  useOptimistic,
  startTransition
} from 'react';
import {
  deleteChatData,
  fetchMoreChatPreviews,
  deleteFilterTagAndDocumentChunks,
  updateChatTitle
} from './action';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  Button,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  DialogContentText,
  Skeleton,
  Divider,
  Typography,
  CircularProgress,
  ListItemText,
  Checkbox,
  Tooltip,
  Menu,
  MenuItem,
  TextField
} from '@mui/material';
import {
  Delete as DeleteIcon,
  MoreHoriz as MoreHorizIcon,
  Share as ShareIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { format, isToday, isYesterday, subDays } from 'date-fns';
import { Tables } from '@/types/database';
import useSWRInfinite from 'swr/infinite';
import { TZDate } from '@date-fns/tz';
import Link from 'next/link';
import {
  useRouter,
  useParams,
  useSearchParams,
  usePathname
} from 'next/navigation';
import ChatIcon from '@mui/icons-material/Chat';
import { useUpload } from '../context/uploadContext';
import ServerUploadPage from './fileupload';
import { createClient } from '@/lib/client/client';
import { decodeBase64, encodeBase64 } from '../lib/base64';
import useSWRImmutable from 'swr/immutable';
import { useFormStatus } from 'react-dom';

type UserInfo = Pick<Tables<'users'>, 'full_name' | 'email' | 'id'>;

type ChatPreview = {
  id: string;
  firstMessage: string;
  created_at: string;
};

interface CombinedDrawerProps {
  userInfo: UserInfo;
  initialChatPreviews: ChatPreview[];
}
interface FileObject {
  name: string;
  created_at: string;
  updated_at: string;
}

const fetcher = async (userId: string) => {
  const supabase = createClient();
  const { data: files, error } = await supabase.rpc('list_objects', {
    bucketid: 'userfiles',
    prefix: `${userId}/`,
    limits: 1000,
    offsets: 0
  });

  if (error) {
    console.error('Error fetching user files:', error);
    return [];
  }

  return (
    files.map((file) => ({
      ...file,
      name: decodeBase64(file.name.split('/').pop() || '')
    })) || []
  );
};
const useCategorizedChats = (chatPreviews: ChatPreview[][] | undefined) => {
  return useMemo(() => {
    const chatPreviewsFlat = chatPreviews ? chatPreviews.flat() : [];
    const getZonedDate = (date: string) =>
      new TZDate(new Date(date), 'Europe/Copenhagen');

    const today = chatPreviewsFlat.filter((chat) =>
      isToday(getZonedDate(chat.created_at))
    );

    const yesterday = chatPreviewsFlat.filter((chat) =>
      isYesterday(getZonedDate(chat.created_at))
    );

    const last7Days = chatPreviewsFlat.filter((chat) => {
      const chatDate = getZonedDate(chat.created_at);
      const sevenDaysAgo = subDays(new Date(), 7);
      return (
        chatDate > sevenDaysAgo && !isToday(chatDate) && !isYesterday(chatDate)
      );
    });

    const last30Days = chatPreviewsFlat.filter((chat) => {
      const chatDate = getZonedDate(chat.created_at);
      const thirtyDaysAgo = subDays(new Date(), 30);
      const sevenDaysAgo = subDays(new Date(), 7);
      return chatDate > thirtyDaysAgo && chatDate <= sevenDaysAgo;
    });

    const last2Months = chatPreviewsFlat.filter((chat) => {
      const chatDate = getZonedDate(chat.created_at);
      const sixtyDaysAgo = subDays(new Date(), 60);
      const thirtyDaysAgo = subDays(new Date(), 30);
      return chatDate > sixtyDaysAgo && chatDate <= thirtyDaysAgo;
    });

    const older = chatPreviewsFlat.filter((chat) => {
      const sixtyDaysAgo = subDays(new Date(), 60);
      return getZonedDate(chat.created_at) <= sixtyDaysAgo;
    });

    return { today, yesterday, last7Days, last30Days, last2Months, older };
  }, [chatPreviews]); // Only recalculate when chatPreviews changes
};

const CombinedDrawer: FC<CombinedDrawerProps> = ({
  userInfo,
  initialChatPreviews
}) => {
  const { selectedMode, selectedBlobs, setSelectedBlobs } = useUpload();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Add toggle function
  const toggleMobileDrawer = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsMobileOpen(!isMobileOpen);
  };

  const currentChatId = typeof params.id === 'string' ? params.id : undefined;

  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const {
    data: chatPreviews,
    mutate: mutateChatPreviews,
    isValidating: isLoadingMore,
    size,
    setSize
  } = useSWRInfinite(
    (index) => [`chatPreviews`, index],
    async ([_, index]) => {
      const offset = index * 25;
      const newChatPreviews = await fetchMoreChatPreviews(offset);
      return newChatPreviews;
    },
    {
      fallbackData: [initialChatPreviews],
      revalidateFirstPage: false,
      revalidateOnFocus: false, // Add these options
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      revalidateOnMount: false
    }
  );

  const hasMore =
    chatPreviews && chatPreviews[chatPreviews.length - 1]?.length === 30;

  const loadMoreChats = useCallback(() => {
    if (!isLoadingMore) {
      setSize(size + 1);
    }
  }, [isLoadingMore, setSize, size]);

  const handleDeleteClick = (id: string) => {
    setChatToDelete(id);
    setDeleteConfirmationOpen(true);
  };

  const handleDeleteConfirmation = async () => {
    if (chatToDelete) {
      try {
        await deleteChatData(chatToDelete);
        await mutateChatPreviews();

        // If the deleted chat is the current one, redirect to /actionchat while preserving pdf parameter
        if (chatToDelete === currentChatId) {
          router.push('/actionchat');
        }
      } catch (error) {
        console.error('Failed to delete the chat:', error);
      }
    }
    setDeleteConfirmationOpen(false);
    setChatToDelete(null);
  };

  const categorizedChats = useCategorizedChats(chatPreviews);

  const handleChatSelect = useCallback(() => {
    // Close drawer on mobile screens
    if (window.innerWidth < 800) {
      // 600px is MUI's sm breakpoint
      setIsMobileOpen(false);
    }
  }, []);
  const {
    data: userFiles = [],
    isLoading: isLoadingFiles,
    mutate: mutateFiles
  } = useSWRImmutable<FileObject[]>(
    selectedMode === 'pdf' && userInfo.id ? `userFiles` : null,
    () => fetcher(userInfo.id)
  );

  const sortedUserFiles = useMemo(() => {
    return [...userFiles].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [userFiles]);

  // Add file list rendering
  const renderFileList = () => {
    const handleSelectBlob = (fileName: string, createdAt: string) => {
      const formattedDate = format(new Date(createdAt), 'yyyy-MM-dd');
      const filterTag = `${fileName}[[${formattedDate}]]`;

      if (selectedBlobs.includes(filterTag)) {
        setSelectedBlobs(selectedBlobs.filter((blob) => blob !== filterTag));
      } else {
        setSelectedBlobs([...selectedBlobs, filterTag]);
      }
    };

    // Get the current PDF from URL parameters
    const currentPdfParam = searchParams.get('pdf');
    const currentPdf = currentPdfParam
      ? decodeBase64(decodeURIComponent(currentPdfParam))
      : null;

    return (
      <List
        sx={{
          overflow: 'auto',
          flex: 1,
          borderTop: '1px solid rgba(0, 0, 0, 0.12)',
          mt: 2
        }}
      >
        {sortedUserFiles.map((file, index) => {
          const formattedDate = format(new Date(file.created_at), 'yyyy-MM-dd');
          const filterTag = `${file.name}[[${formattedDate}]]`;
          const isSelected = selectedBlobs.includes(filterTag);
          const currentParams = new URLSearchParams(searchParams.toString());
          currentParams.set('pdf', encodeURIComponent(encodeBase64(file.name)));
          const href = `${pathname}?${currentParams.toString()}`;

          // Check if this file is the currently selected one from URL
          const isCurrentFile = currentPdf === file.name;

          return (
            <ListItem
              key={index}
              disablePadding
              sx={{
                borderBottom: '1px solid rgba(0, 0, 0, 0.12)' // Add this line
              }}
            >
              <ListItemButton
                component={Link}
                href={href}
                onClick={() => {
                  if (window.innerWidth < 600) {
                    setIsMobileOpen(false);
                  }
                }}
                sx={{
                  py: 0,
                  px: 1,
                  backgroundColor: isCurrentFile
                    ? 'rgba(0, 0, 0, 0.04)'
                    : 'inherit',
                  '&:hover': {
                    backgroundColor: isCurrentFile
                      ? 'rgba(0, 0, 0, 0.08)'
                      : 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                <ListItemText
                  primary={file.name.replace(/_/g, ' ')}
                  secondary={format(new Date(file.created_at), 'PPP')}
                  sx={{
                    '& .MuiListItemText-primary': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }
                  }}
                />
              </ListItemButton>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Checkbox
                  checked={isSelected}
                  onChange={() => handleSelectBlob(file.name, file.created_at)}
                  size="small"
                  onClick={(e) => e.stopPropagation()}
                />
                <Box
                  component="form"
                  action={async (formData: FormData) => {
                    formData.append('filePath', encodeBase64(file.name));
                    formData.append('filterTag', filterTag); // Add the filterTag
                    await deleteFilterTagAndDocumentChunks(formData);
                    await mutateFiles();
                  }}
                >
                  <SubmitButton />
                </Box>
              </Box>
            </ListItem>
          );
        })}
      </List>
    );
  };
  return (
    <>
      <IconButton
        onClick={toggleMobileDrawer}
        size="small"
        sx={{
          display: { xs: 'block', sm: 'block', md: 'none' },
          position: 'fixed',
          left: 4,
          bottom: 42,
          zIndex: 1200
        }}
      >
        <ChatIcon sx={{ color: 'blue' }} />
      </IconButton>
      <Drawer
        variant="persistent"
        anchor="left"
        open
        SlideProps={{ direction: 'left', timeout: 300 }}
        ModalProps={{
          slotProps: {
            backdrop: {
              style: { backgroundColor: 'transparent' }
            }
          }
        }}
        sx={{
          width: {
            xs: isMobileOpen ? '100%' : '0%',
            sm: isMobileOpen ? '40%' : '0%',
            md: '200px',
            lg: '250px',
            xl: '300px'
          },
          '@media (min-width: 2000px)': {
            width: '350px'
          },
          '& .MuiDrawer-paper': {
            boxShadow: 'none',
            width: {
              xs: isMobileOpen ? '100%' : '0%', // Set width to 0 when closed on mobile
              sm: isMobileOpen ? '40%' : '0%',
              md: '200px',
              lg: '250px',
              xl: '300px'
            },
            '@media (min-width: 2000px)': {
              width: '350px'
            },
            visibility: {
              xs: isMobileOpen ? 'visible' : 'hidden', // Hide completely when closed on mobile
              sm: 'visible'
            },
            backgroundColor: 'rgba(240, 247, 255, 0.9)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            transition: 'width 0.3s ease-in-out'
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {!userInfo.email ? (
            // Show sign-in message when no user
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '90vh',
                textAlign: 'center',
                p: 2,
                gap: 2
              }}
            >
              <Typography variant="h6" gutterBottom>
                Sign in to save and view your chats
              </Typography>

              <Button
                component={Link}
                href="/signin"
                variant="contained"
                color="primary"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 4,
                  py: 1
                }}
              >
                Sign in
              </Button>
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  pt: 1,
                  pr: 2
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    textAlign: 'center'
                  }}
                >
                  Chathistorik
                </Typography>
              </Box>
              {selectedMode === 'pdf' ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: 'calc(100vh - 50px)'
                  }}
                >
                  <Box
                    sx={{
                      flex: 1,
                      overflow: 'auto',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {isLoadingFiles ? (
                      <Box
                        sx={{ display: 'flex', justifyContent: 'center', p: 2 }}
                      >
                        <CircularProgress />
                      </Box>
                    ) : (
                      renderFileList()
                    )}
                  </Box>
                  <Box
                    sx={{
                      borderTop: '1px solid rgba(0, 0, 0, 0.12)',
                      p: 1,
                      mt: 'auto',
                      backgroundColor: 'background.paper'
                    }}
                  >
                    <ServerUploadPage userId={userInfo.id} />
                  </Box>
                </Box>
              ) : (
                <List sx={{ overflow: 'auto' }}>
                  {!chatPreviews ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <ListItem key={index} disablePadding>
                        <ListItemButton>
                          <Skeleton variant="text" width="100%" />
                        </ListItemButton>
                      </ListItem>
                    ))
                  ) : (
                    <>
                      <RenderChatSection
                        title="Today"
                        chats={categorizedChats.today || []}
                        currentChatId={currentChatId}
                        handleDeleteClick={handleDeleteClick}
                        onChatSelect={handleChatSelect}
                      />
                      <RenderChatSection
                        title="Yesterday"
                        chats={categorizedChats.yesterday || []}
                        currentChatId={currentChatId}
                        handleDeleteClick={handleDeleteClick}
                        onChatSelect={handleChatSelect}
                      />
                      <RenderChatSection
                        title="Last 7 days"
                        chats={categorizedChats.last7Days || []}
                        currentChatId={currentChatId}
                        handleDeleteClick={handleDeleteClick}
                        onChatSelect={handleChatSelect}
                      />
                      <RenderChatSection
                        title="Last 30 days"
                        chats={categorizedChats.last30Days || []}
                        currentChatId={currentChatId}
                        handleDeleteClick={handleDeleteClick}
                        onChatSelect={handleChatSelect}
                      />
                      <RenderChatSection
                        title="Last 2 month"
                        chats={categorizedChats.last2Months || []}
                        currentChatId={currentChatId}
                        handleDeleteClick={handleDeleteClick}
                        onChatSelect={handleChatSelect}
                      />
                      <RenderChatSection
                        title="Older"
                        chats={categorizedChats.older || []}
                        currentChatId={currentChatId}
                        handleDeleteClick={handleDeleteClick}
                        onChatSelect={handleChatSelect}
                      />
                      {hasMore && (
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            mt: 2,
                            mb: 2
                          }}
                        >
                          <Button
                            onClick={loadMoreChats}
                            disabled={isLoadingMore}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderRadius: '8px',
                              minWidth: '120px'
                            }}
                          >
                            {isLoadingMore ? (
                              <CircularProgress size={20} sx={{ mr: 1 }} />
                            ) : (
                              'Hent flere'
                            )}
                          </Button>
                        </Box>
                      )}
                    </>
                  )}
                </List>
              )}
            </>
          )}
        </Box>
        <Dialog
          open={deleteConfirmationOpen}
          onClose={() => setDeleteConfirmationOpen(false)}
        >
          <DialogContent sx={{ p: 2 }}>
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
      </Drawer>
    </>
  );
};

type RenderChatSectionProps = {
  title: string;
  chats: ChatPreview[];
  currentChatId: string | null | undefined;
  handleDeleteClick: (id: string) => void;
  onChatSelect: (id: string) => void; // Add this prop
};
const RenderChatSection: FC<RenderChatSectionProps> = memo(
  ({ title, chats, currentChatId, handleDeleteClick, onChatSelect }) => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [menuChatId, setMenuChatId] = useState<string | null>(null); // For menu
    const [editingChatId, setEditingChatId] = useState<string | null>(null); // For editing
    const [newTitle, setNewTitle] = useState('');

    const [optimisticChats, addOptimisticChat] = useOptimistic(
      chats,
      (
        currentChats: ChatPreview[],
        optimisticUpdate: { id: string; newTitle: string }
      ) =>
        currentChats.map((chat) =>
          chat.id === optimisticUpdate.id
            ? {
                ...chat,
                chat_messages: [
                  { content: optimisticUpdate.newTitle },
                  ...chat.firstMessage.slice(1)
                ]
              }
            : chat
        )
    );

    const handleMenuClick = (
      event: React.MouseEvent<HTMLElement>,
      chatId: string
    ) => {
      event.preventDefault();
      setAnchorEl(event.currentTarget);
      setMenuChatId(chatId);
    };

    const handleMenuClose = () => {
      setAnchorEl(null);
      setMenuChatId(null);
    };

    const handleOpenRename = (chatId: string) => {
      setEditingChatId(chatId);
      setEditDialogOpen(true);
      handleMenuClose();
    };

    const handleCloseDialog = () => {
      setEditDialogOpen(false);
      setEditingChatId(null);
      setNewTitle('');
    };
    if (optimisticChats.length === 0) return null;

    return (
      <>
        <Divider sx={{ color: 'textSecondary', px: 1, mt: 2.5, mb: 1 }}>
          {title}
        </Divider>
        {optimisticChats.map(({ id, firstMessage }) => {
          const currentParams = new URLSearchParams(searchParams.toString());
          const href = `/actionchat/${id}${
            currentParams.toString() ? '?' + currentParams.toString() : ''
          }`;

          return (
            <Box key={id}>
              <ListItemButton
                component={Link}
                prefetch={false}
                scroll={false}
                href={href}
                onMouseEnter={() => router.prefetch(href)}
                onClick={() => onChatSelect(id)}
                sx={{
                  fontSize: '0.95rem',
                  backgroundColor:
                    currentChatId === id ? 'rgba(0, 0, 0, 0.1)' : 'inherit',
                  paddingRight: '25px',
                  position: 'relative',
                  '& .menu-button': {
                    display: currentChatId === id ? 'flex' : 'none'
                  },
                  '&:hover .menu-button': {
                    display: 'flex'
                  }
                }}
              >
                {/* Tooltip for the chat title */}
                <Tooltip
                  title={firstMessage}
                  placement="top-end"
                  enterDelay={500}
                  enterNextDelay={500}
                >
                  <Box
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1
                    }}
                  >
                    {firstMessage}
                  </Box>
                </Tooltip>

                {/* Separate tooltip for the menu button */}
                <Tooltip title="Options" placement="top">
                  <IconButton
                    className="menu-button"
                    onClick={(e) => handleMenuClick(e, id)}
                    size="small"
                    sx={{
                      padding: '2px',
                      position: 'absolute',
                      right: 4,
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}
                  >
                    <MoreHorizIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </ListItemButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl) && menuChatId === id}
                onClose={handleMenuClose}
                sx={{ borderRadius: '8px' }}
              >
                <MenuItem onClick={() => handleMenuClose()} disabled>
                  <ShareIcon fontSize="small" sx={{ mr: 1 }} />
                  Share
                </MenuItem>
                <MenuItem onClick={() => handleOpenRename(id)}>
                  <EditIcon fontSize="small" sx={{ mr: 1 }} />
                  Rename
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleDeleteClick(id);
                    handleMenuClose();
                  }}
                  sx={{
                    color: 'error.main'
                  }}
                >
                  <DeleteIcon
                    fontSize="small"
                    sx={{ mr: 1, color: 'error.main' }}
                  />
                  Delete
                </MenuItem>
              </Menu>
            </Box>
          );
        })}

        <Dialog open={editDialogOpen} onClose={handleCloseDialog}>
          <Box
            component="form"
            onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const chatId = formData.get('chatId') as string;
              const title = formData.get('title') as string;

              startTransition(async () => {
                // Apply optimistic update immediately
                addOptimisticChat({
                  id: chatId,
                  newTitle: title
                });

                try {
                  const result = await updateChatTitle(formData);

                  if (!result.success) {
                    // If the server action failed, revert the optimistic update
                    const originalChat = chats.find(
                      (chat) => chat.id === chatId
                    );
                    if (originalChat) {
                      addOptimisticChat({
                        id: chatId,
                        newTitle: originalChat.firstMessage
                      });
                    }
                    console.error('Failed to update chat title');
                  }
                } catch (error) {
                  // If there's an error, revert the optimistic update
                  const originalChat = chats.find((chat) => chat.id === chatId);
                  if (originalChat) {
                    addOptimisticChat({
                      id: chatId,
                      newTitle: originalChat.firstMessage
                    });
                  }
                  console.error('Error updating chat title:', error);
                }
              });

              handleCloseDialog();
            }}
            sx={{ p: 1, minWidth: '400px' }}
          >
            <input type="hidden" name="chatId" value={editingChatId || ''} />
            <TextField
              autoFocus
              margin="dense"
              name="title"
              label="New name"
              type="text"
              fullWidth
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />

            <DialogActions>
              <Button
                variant="outlined"
                onClick={handleCloseDialog}
                color="error"
                sx={{ mr: 1 }}
              >
                Cancel
              </Button>
              <Button variant="outlined" type="submit">
                Save
              </Button>
            </DialogActions>
          </Box>
        </Dialog>
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.title === nextProps.title &&
      prevProps.currentChatId === nextProps.currentChatId &&
      prevProps.chats.length === nextProps.chats.length &&
      prevProps.chats.every((chat, index) => {
        const nextChat = nextProps.chats[index];
        return (
          chat.id === nextChat.id && chat.firstMessage === nextChat.firstMessage
        );
      })
    );
  }
);

RenderChatSection.displayName = 'RenderChatSection';

export default CombinedDrawer;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <IconButton
      type="submit"
      size="small"
      color="error"
      sx={{ width: '100%' }} // Use sx instead of fullWidth
      disabled={pending}
    >
      {pending ? (
        <CircularProgress size={24} color="inherit" />
      ) : (
        <DeleteIcon />
      )}
    </IconButton>
  );
}
