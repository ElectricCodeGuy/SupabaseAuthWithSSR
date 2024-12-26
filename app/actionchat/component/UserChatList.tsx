'use client';
import React, { type FC, useState, memo, useCallback, useMemo } from 'react';
import {
  deleteChatData,
  fetchChatPreviews,
  deleteFilterTagAndDocumentChunks
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
  Chip,
  Divider,
  Typography,
  CircularProgress,
  ListItemText,
  Checkbox
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { format, isToday, isYesterday, subDays } from 'date-fns';
import { Tables } from '@/types/database';
import useSWRInfinite from 'swr/infinite';
import { da } from 'date-fns/locale';
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
  id: Tables<'chat_sessions'>['id'];
  created_at: Tables<'chat_sessions'>['created_at'];
  chat_messages: {
    content: Tables<'chat_messages'>['content'];
  }[];
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
      const newChatPreviews = await fetchChatPreviews(offset, 25);
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
    chatPreviews && chatPreviews[chatPreviews.length - 1]?.length === 25;

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

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PP', { locale: da });
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
                  py: 0.5,
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
                  secondary={format(new Date(file.created_at), 'PP', {
                    locale: da
                  })}
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
                  pt: 2,
                  pr: 2
                }}
              >
                <Typography
                  variant="h3"
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
                    height: 'calc(100vh - 42px)'
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
                        formatDate={formatDate}
                        onChatSelect={handleChatSelect}
                      />
                      <RenderChatSection
                        title="Yesterday"
                        chats={categorizedChats.yesterday || []}
                        currentChatId={currentChatId}
                        handleDeleteClick={handleDeleteClick}
                        formatDate={formatDate}
                        onChatSelect={handleChatSelect}
                      />
                      <RenderChatSection
                        title="Last 7 days"
                        chats={categorizedChats.last7Days || []}
                        currentChatId={currentChatId}
                        handleDeleteClick={handleDeleteClick}
                        formatDate={formatDate}
                        onChatSelect={handleChatSelect}
                      />
                      <RenderChatSection
                        title="Last 30 days"
                        chats={categorizedChats.last30Days || []}
                        currentChatId={currentChatId}
                        handleDeleteClick={handleDeleteClick}
                        formatDate={formatDate}
                        onChatSelect={handleChatSelect}
                      />
                      <RenderChatSection
                        title="Last 2 month"
                        chats={categorizedChats.last2Months || []}
                        currentChatId={currentChatId}
                        handleDeleteClick={handleDeleteClick}
                        formatDate={formatDate}
                        onChatSelect={handleChatSelect}
                      />
                      <RenderChatSection
                        title="Older"
                        chats={categorizedChats.older || []}
                        currentChatId={currentChatId}
                        handleDeleteClick={handleDeleteClick}
                        formatDate={formatDate}
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
  handleDeleteClick: (_id: string) => void;
  formatDate: (_dateString: string) => string;
  onChatSelect: (id: string) => void; // Add this prop
};
const RenderChatSection: FC<RenderChatSectionProps> = memo(
  ({
    title,
    chats,
    currentChatId,
    handleDeleteClick,
    formatDate,
    onChatSelect
  }) => {
    const searchParams = useSearchParams();
    const router = useRouter();
    if (chats.length === 0) return null;

    return (
      <>
        <Divider sx={{ color: 'textSecondary', px: 1, mb: 2 }}>{title}</Divider>
        {chats.map(({ id, chat_messages, created_at }) => {
          const firstMessage = chat_messages[0]?.content || 'No messages yet';
          const currentParams = new URLSearchParams(searchParams.toString());
          const href = `/actionchat/${id}${
            currentParams.toString() ? '?' + currentParams.toString() : ''
          }`;

          return (
            <ListItemButton
              key={id}
              onMouseEnter={() => router.prefetch(href)}
              onClick={() => onChatSelect(id)}
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
              component={Link}
              prefetch={false}
              href={href}
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
          );
        })}
      </>
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
