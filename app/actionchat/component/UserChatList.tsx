import React, { type FC, useState, useMemo } from 'react';
import { deleteChatData } from '../actionFetch';
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
  Typography
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { format, differenceInDays, isToday, isYesterday } from 'date-fns';
import { useSWRConfig } from 'swr';

type UserInfo = {
  id: string;
  full_name: string;
};

type ChatPreview = {
  id: string;
  firstMessage: string;
  created_at: string;
};

type CombinedDrawerProps = {
  chatPreviews: ChatPreview[];
  userInfo: UserInfo;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (_isOpen: boolean) => void;
  ChatHistoryUpdate: (
    _full_name: string,
    _chatId: string,
    _userId: string
  ) => Promise<{
    uiMessages: { id: number | string | null; display: React.ReactNode }[];
    chatId: string;
  }>;
  setMessages: React.Dispatch<
    React.SetStateAction<
      { id: number | string | null; display: React.ReactNode }[]
    >
  >;
  currentChatId: string | null | undefined;
  isChatPreviewsLoading: boolean;
};

const CombinedDrawer: FC<CombinedDrawerProps> = ({
  chatPreviews,
  userInfo,
  isDrawerOpen,
  setIsDrawerOpen,
  ChatHistoryUpdate,
  setMessages,
  currentChatId,
  isChatPreviewsLoading
}) => {
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

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
        mutate(
          userInfo.id,
          (currentChatPreviews: ChatPreview[] = []) => {
            return currentChatPreviews.filter(
              (chat) => chat.id !== chatToDelete
            );
          },
          false
        );

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
        userInfo.full_name,
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
    const today: ChatPreview[] = [];
    const yesterday: ChatPreview[] = [];
    const last7Days: ChatPreview[] = [];
    const last30Days: ChatPreview[] = [];
    const older: ChatPreview[] = [];

    chatPreviews.forEach((chat: ChatPreview) => {
      const chatDate = new Date(chat.created_at);
      if (isToday(chatDate)) {
        today.push(chat);
      } else if (isYesterday(chatDate)) {
        yesterday.push(chat);
      } else if (differenceInDays(new Date(), chatDate) <= 7) {
        last7Days.push(chat);
      } else if (differenceInDays(new Date(), chatDate) <= 30) {
        last30Days.push(chat);
      } else {
        older.push(chat);
      }
    });

    return { today, yesterday, last7Days, last30Days, older };
  }, [chatPreviews]);

  const { today, yesterday, last7Days, last30Days, older } = categorizedChats;

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
        width: '350px',
        '& .MuiPaper-root': { boxShadow: 'none', width: '350px' }
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
            Chat Historic
          </Typography>
        </Box>
        <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
          <List>
            {isChatPreviewsLoading ? (
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
                  title="I dag"
                  chats={today}
                  currentChatId={currentChatId}
                  handleChatClick={handleChatClick}
                  handleDeleteClick={handleDeleteClick}
                  hoveredChatId={hoveredChatId}
                  setHoveredChatId={setHoveredChatId}
                  truncateMessage={truncateMessage}
                  formatDate={formatDate}
                />
                <RenderChatSection
                  title="I går"
                  chats={yesterday}
                  currentChatId={currentChatId}
                  handleChatClick={handleChatClick}
                  handleDeleteClick={handleDeleteClick}
                  hoveredChatId={hoveredChatId}
                  setHoveredChatId={setHoveredChatId}
                  truncateMessage={truncateMessage}
                  formatDate={formatDate}
                />
                <RenderChatSection
                  title="Sidste 7 dage"
                  chats={last7Days}
                  currentChatId={currentChatId}
                  handleChatClick={handleChatClick}
                  handleDeleteClick={handleDeleteClick}
                  hoveredChatId={hoveredChatId}
                  setHoveredChatId={setHoveredChatId}
                  truncateMessage={truncateMessage}
                  formatDate={formatDate}
                />
                <RenderChatSection
                  title="Sidste 30 dage"
                  chats={last30Days}
                  currentChatId={currentChatId}
                  handleChatClick={handleChatClick}
                  handleDeleteClick={handleDeleteClick}
                  hoveredChatId={hoveredChatId}
                  setHoveredChatId={setHoveredChatId}
                  truncateMessage={truncateMessage}
                  formatDate={formatDate}
                />
                <RenderChatSection
                  title="Ældre"
                  chats={older}
                  currentChatId={currentChatId}
                  handleChatClick={handleChatClick}
                  handleDeleteClick={handleDeleteClick}
                  hoveredChatId={hoveredChatId}
                  setHoveredChatId={setHoveredChatId}
                  truncateMessage={truncateMessage}
                  formatDate={formatDate}
                />
              </>
            )}
          </List>
        </Box>
      </Box>
      <Dialog
        open={deleteConfirmationOpen}
        onClose={() => setDeleteConfirmationOpen(false)}
      >
        <DialogTitle>Bekræft sletning</DialogTitle>
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
              {truncateMessage(firstMessage || `Chat ID: ${id}`, 32)}
              <Chip
                label={formatDate(created_at)}
                size="small"
                sx={{
                  position: 'absolute',
                  top: '8px',
                  right: '20px',
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
