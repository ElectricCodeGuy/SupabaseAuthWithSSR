import React, { type FC, useState, useMemo } from 'react';
import { deleteChatData, fetchChatPreviews } from './action';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  Tooltip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Skeleton,
  Chip,
  Divider,
  Typography,
  CircularProgress,
  styled,
  tooltipClasses,
  TooltipProps
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { format, differenceInDays, isToday, isYesterday } from 'date-fns';
import { ClientMessage, ChatHistoryUpdateResult } from '../action';
import useSWRInfinite from 'swr/infinite';
import { Tables } from '@/types/database';

type UserData = Tables<'users'>;

const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#f5f5f9',
    color: 'rgba(0, 0, 0, 0.87)',
    maxWidth: 360,
    maxHeight: 360,
    overflowY: 'auto',
    overflowX: 'hidden',
    fontSize: theme.typography.pxToRem(16),
    border: '1px solid #dadde9'
  }
}));

type ChatPreview = {
  id: Tables<'chat_sessions'>['id'];
  created_at: Tables<'chat_sessions'>['created_at'];
  chat_messages: {
    content: Tables<'chat_messages'>['content'];
  }[];
};

interface CombinedDrawerProps {
  userInfo: UserData;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (isOpen: boolean) => void;
  ChatHistoryUpdate: (
    full_name: string,
    chatId: string
  ) => Promise<ChatHistoryUpdateResult>;
  setMessages: (messages: ClientMessage[]) => void;
  currentChatId: string | null | undefined;
}

const CombinedDrawer: FC<CombinedDrawerProps> = ({
  userInfo,
  isDrawerOpen,
  setIsDrawerOpen,
  ChatHistoryUpdate,
  setMessages,
  currentChatId
}) => {
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const {
    data: chatPreviews,
    mutate: mutateChatPreviews,
    isValidating: isLoadingMore,
    size,
    setSize
  } = useSWRInfinite(
    isDrawerOpen ? (index) => [index, 30] : () => null,
    async ([index, limit]: [number, number]) => {
      const offset = index * limit;
      const newChatPreviews = await fetchChatPreviews(offset, limit);
      return newChatPreviews;
    }
  );

  const hasMore =
    chatPreviews && chatPreviews[chatPreviews.length - 1].length === 30;

  const loadMoreChats = () => {
    setSize(size + 1);
  };

  const handleDeleteClick = (id: string) => {
    setChatToDelete(id);
    setDeleteConfirmationOpen(true);
  };

  const handleDeleteConfirmation = async () => {
    if (chatToDelete) {
      try {
        await deleteChatData(chatToDelete);
        // Optimistically update the local cache
        mutateChatPreviews((currentChatPreviews: ChatPreview[][] = []) => {
          return currentChatPreviews.map((chatPreviewPage) =>
            chatPreviewPage.filter((chat) => chat.id !== chatToDelete)
          );
        }, false);

        if (currentChatId === chatToDelete) {
          setMessages([]);
        }
      } catch (error) {
        console.error('Failed to delete the chat:', error);
      }
    }
    setDeleteConfirmationOpen(false);
    setChatToDelete(null);
  };

  const handleChatClick = async (id: string) => {
    try {
      const { uiMessages, chatId } = await ChatHistoryUpdate(
        userInfo.full_name || 'Unknown User',
        id
      );
      setMessages(uiMessages.map((message) => ({ ...message, chatId }))); // Set the chatId for each message
    } catch (error) {
      console.error('Failed to update chat history:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy-MM-dd');
  };

  const categorizedChats = useMemo(() => {
    const chatPreviewsFlat = chatPreviews ? chatPreviews.flat() : [];

    if (chatPreviewsFlat.length === 0) return {};

    const today: ChatPreview[] = [];
    const yesterday: ChatPreview[] = [];
    const last7Days: ChatPreview[] = [];
    const last30Days: ChatPreview[] = [];
    const last2Months: ChatPreview[] = [];
    const older: ChatPreview[] = [];

    chatPreviewsFlat.forEach((chat: ChatPreview) => {
      const chatDate = new Date(chat.created_at);
      if (isToday(chatDate)) {
        today.push(chat);
      } else if (isYesterday(chatDate)) {
        yesterday.push(chat);
      } else if (differenceInDays(new Date(), chatDate) <= 7) {
        last7Days.push(chat);
      } else if (differenceInDays(new Date(), chatDate) <= 30) {
        last30Days.push(chat);
      } else if (differenceInDays(new Date(), chatDate) <= 60) {
        last2Months.push(chat);
      } else {
        older.push(chat);
      }
    });

    return { today, yesterday, last7Days, last30Days, last2Months, older };
  }, [chatPreviews]);

  return (
    <Drawer
      variant="temporary"
      anchor="right"
      open={isDrawerOpen}
      onClose={() => setIsDrawerOpen(false)}
      SlideProps={{ direction: 'left', timeout: 300 }}
      ModalProps={{
        keepMounted: true, // Better performance on mobile
        slotProps: {
          backdrop: {
            style: { backgroundColor: 'transparent' }
          }
        }
      }}
      sx={{
        width: {
          xs: '300px',
          sm: '300px',
          md: '350px',
          lg: '350px',
          xl: '350px'
        },
        '& .MuiPaper-root': {
          boxShadow: 'none',
          width: {
            xs: '300px',
            sm: '300px',
            md: '350px',
            lg: '350px',
            xl: '350px'
          },
          backgroundColor: 'rgba(240, 247, 255, 0.9)',
          border: '1px solid rgba(0, 0, 0, 0.1)' // Slim, dark border
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
          <Typography variant="h3" sx={{ textAlign: 'center' }}>
            Chat History
          </Typography>
        </Box>
        <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
          <List>
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
                {chatPreviews.length === 0 ? (
                  <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                    You do not have any chat history yet. Start a new chat to
                    view your chat history.
                  </Typography>
                ) : (
                  <>
                    <RenderChatSection
                      title="Today"
                      chats={categorizedChats.today || []}
                      currentChatId={currentChatId}
                      handleChatClick={handleChatClick}
                      handleDeleteClick={handleDeleteClick}
                      hoveredChatId={hoveredChatId}
                      setHoveredChatId={setHoveredChatId}
                      formatDate={formatDate}
                    />
                    <RenderChatSection
                      title="Yesterday"
                      chats={categorizedChats.yesterday || []}
                      currentChatId={currentChatId}
                      handleChatClick={handleChatClick}
                      handleDeleteClick={handleDeleteClick}
                      hoveredChatId={hoveredChatId}
                      setHoveredChatId={setHoveredChatId}
                      formatDate={formatDate}
                    />
                    <RenderChatSection
                      title="Last 7 days"
                      chats={categorizedChats.last7Days || []}
                      currentChatId={currentChatId}
                      handleChatClick={handleChatClick}
                      handleDeleteClick={handleDeleteClick}
                      hoveredChatId={hoveredChatId}
                      setHoveredChatId={setHoveredChatId}
                      formatDate={formatDate}
                    />
                    <RenderChatSection
                      title="Last 30 days"
                      chats={categorizedChats.last30Days || []}
                      currentChatId={currentChatId}
                      handleChatClick={handleChatClick}
                      handleDeleteClick={handleDeleteClick}
                      hoveredChatId={hoveredChatId}
                      setHoveredChatId={setHoveredChatId}
                      formatDate={formatDate}
                    />
                    <RenderChatSection
                      title="Last 2 months"
                      chats={categorizedChats.last2Months || []}
                      currentChatId={currentChatId}
                      handleChatClick={handleChatClick}
                      handleDeleteClick={handleDeleteClick}
                      hoveredChatId={hoveredChatId}
                      setHoveredChatId={setHoveredChatId}
                      formatDate={formatDate}
                    />
                    <RenderChatSection
                      title="Older chats"
                      chats={categorizedChats.older || []}
                      currentChatId={currentChatId}
                      handleChatClick={handleChatClick}
                      handleDeleteClick={handleDeleteClick}
                      hoveredChatId={hoveredChatId}
                      setHoveredChatId={setHoveredChatId}
                      formatDate={formatDate}
                    />
                    {hasMore && (
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          mt: 2
                        }}
                      >
                        {isLoadingMore ? (
                          <CircularProgress size={24} />
                        ) : (
                          <Button
                            onClick={loadMoreChats}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderRadius: '8px'
                            }}
                          >
                            Load more
                          </Button>
                        )}
                      </Box>
                    )}
                  </>
                )}
              </>
            )}
          </List>
        </Box>
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
    </Drawer>
  );
};

type RenderChatSectionProps = {
  title: string;
  chats: ChatPreview[];
  currentChatId: string | null | undefined;
  handleChatClick: (_id: string) => void;
  handleDeleteClick: (_id: string) => void;
  hoveredChatId: string | null;
  setHoveredChatId: React.Dispatch<React.SetStateAction<string | null>>;
  formatDate: (_dateString: string) => string;
};

const RenderChatSection: FC<RenderChatSectionProps> = ({
  title,
  chats,
  currentChatId,
  handleChatClick,
  handleDeleteClick,
  hoveredChatId,
  setHoveredChatId,
  formatDate
}) => {
  if (chats.length === 0) return null;

  return (
    <>
      <Divider>
        <Typography
          variant="caption"
          sx={{
            color: 'textSecondary'
          }}
        >
          {title}
        </Typography>
      </Divider>
      {chats.map(({ id, chat_messages, created_at }) => {
        const firstMessage = chat_messages[0]?.content || 'No messages yet';
        return (
          <HtmlTooltip key={id} title={firstMessage} placement="right" arrow>
            <ListItem
              disablePadding
              onMouseEnter={() => setHoveredChatId(id)}
              onMouseLeave={() => setHoveredChatId(null)}
              sx={{ position: 'relative' }}
            >
              <ListItemButton
                sx={{
                  fontSize: '0.95rem',
                  backgroundColor:
                    currentChatId === id ? 'rgba(0, 0, 0, 0.1)' : 'inherit',
                  paddingRight: '30px',
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
                  }
                }}
                onClick={() => handleChatClick(id)}
                data-truncated-message={firstMessage}
              />
              <Chip
                label={formatDate(created_at)}
                size="small"
                sx={{
                  position: 'absolute',
                  top: '8px',
                  right: {
                    xs: '4px',
                    sm: '4px',
                    md: '20px'
                  },
                  fontSize: '0.6rem'
                }}
              />
              {hoveredChatId === id && (
                <IconButton
                  onClick={() => handleDeleteClick(id)}
                  size="small"
                  sx={{
                    padding: '2px',
                    position: 'absolute',
                    right: 0
                  }}
                >
                  <DeleteIcon fontSize="inherit" />
                </IconButton>
              )}
            </ListItem>
          </HtmlTooltip>
        );
      })}
    </>
  );
};

export default CombinedDrawer;
