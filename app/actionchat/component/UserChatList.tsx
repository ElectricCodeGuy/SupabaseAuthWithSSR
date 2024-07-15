import React, { type FC, useState, useMemo } from 'react';
import { deleteChatData, fetchChatPreviews } from '../actionFetch';
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
  CircularProgress
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { format, differenceInDays, isToday, isYesterday } from 'date-fns';
import { useSWRConfig } from 'swr';
import { ClientMessage, ChatHistoryUpdateResult } from '../action';
import useSWRInfinite from 'swr/infinite';
import { Tables } from '@/types/database';

type UserData = Tables<'users'>;

type ChatPreview = {
  id: string;
  firstMessage: string;
  created_at: string;
};

interface CombinedDrawerProps {
  userInfo: UserData;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (isOpen: boolean) => void;
  ChatHistoryUpdate: (
    full_name: string,
    chatId: string,
    userId: string
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
    isDrawerOpen
      ? (index) => [`userChatsIndex:${userInfo.id}`, index * 30]
      : () => null,
    async ([_, offset]: [string, number]) => {
      const newChatPreviews = await fetchChatPreviews(userInfo.id, offset, 30);
      return newChatPreviews;
    }
  );

  const hasMore =
    chatPreviews && chatPreviews[chatPreviews.length - 1].length === 30;

  const loadMoreChats = () => {
    setSize(size + 1);
  };

  const { mutate } = useSWRConfig();

  const truncateMessage = (message: string, length: number) => {
    return message.length > length
      ? `${message.substring(0, length)}...`
      : message;
  };

  const handleDeleteClick = (id: string) => {
    setChatToDelete(id);
    setDeleteConfirmationOpen(true);
  };

  const handleDeleteConfirmation = async () => {
    if (chatToDelete) {
      try {
        await deleteChatData(userInfo.id, chatToDelete);
        // Optimistically update the local cache
        mutateChatPreviews((currentChatPreviews: ChatPreview[][] = []) => {
          return currentChatPreviews.map((chatPreviewPage) =>
            chatPreviewPage.filter((chat) => chat.id !== chatToDelete)
          );
        }, false);

        // Check if the deleted chat is the currently selected chat
        if (currentChatId === chatToDelete) {
          setMessages([]); // Update the setMessages state to an empty array
        }

        // Revalidate the cache
        mutate(userInfo.id);
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
        id,
        userInfo.id
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
                      truncateMessage={truncateMessage}
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
                      truncateMessage={truncateMessage}
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
                      truncateMessage={truncateMessage}
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
                      truncateMessage={truncateMessage}
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
                      truncateMessage={truncateMessage}
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
                      truncateMessage={truncateMessage}
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
  truncateMessage: (_message: string, _length: number) => string;
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
  truncateMessage,
  formatDate
}) => {
  if (chats.length === 0) return null;

  return (
    <>
      <Divider>
        <Typography variant="caption" color="textSecondary">
          {title}
        </Typography>
      </Divider>
      {chats.map(({ id, firstMessage, created_at }) => (
        <Tooltip
          key={id}
          title={firstMessage || 'No messages yet'}
          placement="right"
          arrow
        >
          <ListItem
            disablePadding
            onMouseEnter={() => setHoveredChatId(id)}
            onMouseLeave={() => setHoveredChatId(null)}
            sx={{ position: 'relative' }}
          >
            <ListItemButton
              sx={{
                fontSize: '0.9rem',
                backgroundColor:
                  currentChatId === id ? 'rgba(0, 0, 0, 0.1)' : 'inherit',
                paddingRight: '30px'
              }}
              onClick={() => handleChatClick(id)}
            >
              {truncateMessage(firstMessage, 28)}
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
            </ListItemButton>
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
        </Tooltip>
      ))}
    </>
  );
};

export default CombinedDrawer;
