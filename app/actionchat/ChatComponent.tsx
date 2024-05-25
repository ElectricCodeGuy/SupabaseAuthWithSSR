'use client';
import React, { useState, KeyboardEvent, FormEvent, lazy } from 'react';
import { useUIState, useActions } from 'ai/rsc';
import { type AI } from './action';
import { UserMessage } from './component/botmessage';
import {
  IconButton,
  InputAdornment,
  TextField,
  Box,
  CircularProgress,
  Container,
  Typography,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  Link as MuiLink,
  MenuItem
} from '@mui/material';
import {
  Send as SendIcon,
  Stop as StopIcon,
  DeleteSweep as DeleteSweepIcon,
  Chat as ChatListIcon
} from '@mui/icons-material';
import { ChatScrollAnchor } from './hooks/chat-scroll-anchor';
import { fetchChatPreviews } from './actionFetch';
import useSWR from 'swr';

const ChatHistoryDrawer = lazy(() => import('./component/UserChatList'));

type UserInfo = {
  id: string;
  full_name: string;
  email: string;
};

interface ChatComponentPageProps {
  userInfo: UserInfo | null;
}

export default function ChatComponentPage({
  userInfo
}: ChatComponentPageProps) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useUIState<typeof AI>();
  const [isLoading, setIsLoading] = useState(false);
  const { submitMessage, ChatHistoryUpdate } = useActions();
  const [isUserChatListOpen, setIsUserChatListOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('claude3');

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && event.shiftKey) {
      // Allow newline on Shift + Enter
    } else if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit(event as unknown as FormEvent<HTMLFormElement>);
    }
  };

  const handleClearMessages = () => {
    setMessages([]);
  };

  const { data: chatPreviews = [], isLoading: isChatPreviewsLoading } = useSWR(
    isUserChatListOpen && userInfo ? userInfo.id : null,
    async (userId: string) => {
      const chatPreviews = await fetchChatPreviews(userId);
      return chatPreviews;
    }
  );

  const handleLoadChatData = () => {
    setIsUserChatListOpen(true);
  };

  return (
    <Container
      maxWidth={'md'}
      sx={{
        mt: 6,
        mb: 4,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease-in-out',
        height: '90vh',
        overflow: 'auto'
      }}
    >
      {messages.length === 0 ? (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          height="100%"
          textAlign="center"
          p={4}
        >
          <Typography variant="h3" color="textSecondary" paragraph>
            Chat with our AI Assistant
          </Typography>
          <>
            <Typography variant="body1" color="textSecondary" paragraph>
              Experience the power of AI-driven conversations with our chat
              template. Ask questions on any topic and get informative responses
              instantly.
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              <strong>
                Check out{' '}
                <MuiLink
                  href="https://www.lovguiden.dk/"
                  target="_blank"
                  rel="noopener"
                  style={{ fontSize: '1.2rem', color: 'blue' }}
                >
                  Lovguiden
                </MuiLink>
                , a Danish legal AI platform, for a real-world example of AI in
                action.
              </strong>
            </Typography>
            <Typography variant="h4" color="textSecondary">
              Start chatting now and enjoy the AI experience!
            </Typography>
          </>
        </Box>
      ) : (
        // Render messages
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages.map((message: any) => (
          <Box
            key={message.id}
            width="100%"
            sx={{
              padding: '2px'
            }}
          >
            {message.display}
          </Box>
        ))
      )}
      <ChatScrollAnchor trackVisibility={true} />
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          left: '50%',
          transform: 'translateX(-50%)',
          position: 'fixed',
          width: '33.334%',
          bottom: 5,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'left 0.3s ease-in-out'
        }}
      >
        {userInfo !== null && (
          <>
            <IconButton
              aria-label="open chat list"
              color="primary"
              onClick={handleLoadChatData}
              sx={{ marginRight: '8px' }}
            >
              <ChatListIcon />
            </IconButton>
          </>
        )}
        <TextField
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          variant="outlined"
          multiline
          maxRows={4}
          disabled={isLoading}
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {isLoading ? (
                  <IconButton
                    onClick={stop}
                    color="primary"
                    sx={{
                      '&:hover .MuiCircularProgress-root': {
                        display: 'none'
                      },
                      '&:hover .stop-icon': {
                        display: 'inline-flex'
                      }
                    }}
                  >
                    <CircularProgress
                      size={24}
                      sx={{
                        display: 'inline-flex',
                        '&:hover': {
                          display: 'none'
                        }
                      }}
                    />
                    <StopIcon
                      className="stop-icon"
                      sx={{
                        display: 'none',
                        '&:hover': {
                          display: 'inline-flex'
                        }
                      }}
                    />
                  </IconButton>
                ) : (
                  <>
                    <IconButton
                      aria-label="send message"
                      color="primary"
                      onClick={handleSubmit}
                    >
                      <SendIcon />
                    </IconButton>
                    {messages.length > 0 && (
                      <Tooltip title="Ryd alle beskeder">
                        <IconButton
                          aria-label="clear messages"
                          color="primary"
                          onClick={handleClearMessages}
                        >
                          <DeleteSweepIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </>
                )}
              </InputAdornment>
            ),
            style: {
              padding: '10px'
            }
          }}
          sx={{
            '.MuiOutlinedInput-root': {
              backgroundColor: 'white',
              borderRadius: '20px',
              '& .MuiOutlinedInput-inputMultiline': {
                padding: '0px'
              }
            },
            '& .MuiInputLabel-root': {
              top: -4,
              left: -4
            },
            width: {
              sm: '100%',
              md: '100%',
              lg: '100%',
              xl: '90%'
            }
          }}
        />

        {userInfo && (
          <>
            <ChatHistoryDrawer
              chatPreviews={chatPreviews}
              userInfo={userInfo}
              isDrawerOpen={isUserChatListOpen}
              setIsDrawerOpen={setIsUserChatListOpen}
              ChatHistoryUpdate={ChatHistoryUpdate}
              setMessages={setMessages}
              currentChatId={
                messages.length > 0
                  ? messages[messages.length - 1].chatId
                  : null
              }
              isChatPreviewsLoading={isChatPreviewsLoading}
            />
            <FormControl sx={{ minWidth: 150, marginLeft: '16px' }}>
              <InputLabel id="model-select-label">Model</InputLabel>
              <Select
                labelId="model-select-label"
                id="model-select"
                value={selectedModel}
                label="Model"
                onChange={(event) =>
                  setSelectedModel(event.target.value as string)
                }
              >
                <MenuItem value="claude3">Claude</MenuItem>
                <MenuItem value="chatgpt4">ChatGPT-4</MenuItem>
              </Select>
            </FormControl>
          </>
        )}
      </Box>
    </Container>
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = inputValue.trim();
    if (value === '') {
      return;
    }

    if (!userInfo) {
      setInputValue('');
      return;
    }

    const currentChatId =
      messages.length > 0 ? messages[messages.length - 1].chatId : null;

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: Date.now(),
        display: (
          <UserMessage full_name={userInfo?.full_name || 'Default_user'}>
            {value}
          </UserMessage>
        ),
        chatId: currentChatId
      }
    ]);
    setIsLoading(true);

    const responseMessage = await submitMessage(
      inputValue,
      selectedModel, // Pass the selected model instead of docArray
      currentChatId
    );

    setMessages((currentMessages) => [...currentMessages, responseMessage]);
    setInputValue('');
    setIsLoading(false);
  }
}
