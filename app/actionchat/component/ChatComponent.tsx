'use client';
import React, { useState, KeyboardEvent, lazy } from 'react';
import { useUIState, useActions } from 'ai/rsc';
import { type AI } from '../action';
import { UserMessage } from './botmessage';
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
import { ChatScrollAnchor } from '../hooks/chat-scroll-anchor';
import { Tables } from '@/types/database';

const ChatHistoryDrawer = lazy(() => import('./UserChatList'));

type UserData = Pick<Tables<'users'>, 'email' | 'full_name'>;

interface ChatComponentPageProps {
  userInfo: UserData | null;
}

export default function ChatComponentPage({
  userInfo
}: ChatComponentPageProps) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useUIState<typeof AI>();
  const [isLoading, setIsLoading] = useState(false);
  const { submitMessage, ChatHistoryUpdate, resetMessages } =
    useActions<typeof AI>();
  const [isUserChatListOpen, setIsUserChatListOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'claude3' | 'chatgpt4'>(
    'claude3'
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && event.shiftKey) {
      // Allow newline on Shift + Enter
    } else if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  const handleClearMessages = async () => {
    if (messages.length > 0) {
      const result = await resetMessages();
      if (result.success) {
        setMessages([]);
        // Optionally, you can show a success message to the user
        // For example, using a snackbar or alert
      } else {
        // Handle the error, maybe show an error message to the user
        console.error('Failed to reset messages:', result.message);
      }
    }
  };

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
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            textAlign: 'center',
            p: 4
          }}
        >
          <Typography
            variant="h3"
            sx={{
              color: 'textSecondary',
              mb: 2
            }}
          >
            Chat with our AI Assistant
          </Typography>
          <>
            <Typography
              variant="body1"
              sx={{
                color: 'textSecondary',
                mb: 2
              }}
            >
              Experience the power of AI-driven conversations with our chat
              template. Ask questions on any topic and get informative responses
              instantly.
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'textSecondary',
                mb: 2
              }}
            >
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
            <Typography
              variant="h4"
              sx={{
                color: 'textSecondary'
              }}
            >
              Start chatting now and enjoy the AI experience!
            </Typography>
          </>
        </Box>
      ) : (
        messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              width: '100%',
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
          width: {
            xs: '100%',
            sm: '80%',
            md: '70%',
            lg: '60%',
            xl: '40%'
          },
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
          size="small"
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
          slotProps={{
            input: {
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
              )
            }
          }}
        />

        {userInfo && (
          <>
            <ChatHistoryDrawer
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
            />
            <FormControl sx={{ minWidth: 100, marginLeft: '8px' }}>
              <InputLabel id="model-select-label" size="small">
                Model
              </InputLabel>
              <Select
                labelId="model-select-label"
                id="model-select"
                value={selectedModel}
                label="Model"
                onChange={(event) =>
                  setSelectedModel(event.target.value as 'claude3' | 'chatgpt4')
                }
                size="small"
                sx={{ fontSize: '0.875rem' }}
              >
                <MenuItem value="claude3" sx={{ fontSize: '0.875rem' }}>
                  Claude
                </MenuItem>
                <MenuItem value="chatgpt4" sx={{ fontSize: '0.875rem' }}>
                  GPT-4
                </MenuItem>
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
        role: 'user',
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
      selectedModel,
      currentChatId || ''
    );

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        ...responseMessage,
        role: 'assistant',
        id: responseMessage.id || Date.now(),
        display: responseMessage.display
      }
    ]);
    setInputValue('');
    setIsLoading(false);
  }
}
