'use client';
import React, { useState, KeyboardEvent } from 'react';
import { useUIState, useActions } from 'ai/rsc';
import { type AI } from '../action';
import { UserMessage } from './botmessage';
import {
  IconButton,
  InputAdornment,
  TextField,
  Box,
  CircularProgress,
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
  DeleteSweep as DeleteSweepIcon
} from '@mui/icons-material';
import { ChatScrollAnchor } from '../hooks/chat-scroll-anchor';
import { Tables } from '@/types/database';
import ErrorBoundary from './ErrorBoundary';

type UserData = Pick<Tables<'users'>, 'email' | 'full_name'>;

interface ChatComponentPageProps {
  userInfo: UserData | null;
  chatId?: string;
}

export default function ChatComponentPage({
  userInfo,
  chatId
}: ChatComponentPageProps) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useUIState<typeof AI>();
  const [isLoading, setIsLoading] = useState(false);
  const { submitMessage, resetMessages } = useActions<typeof AI>();
  const [selectedModel, setSelectedModel] = useState<'claude3' | 'chatgpt4'>(
    'claude3'
  );
  const currentChatId = chatId || '';
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

  return (
    <ErrorBoundary>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: {
            xs: '100vh',
            sm: '100vh',
            md: '100vh'
          },
          overflow: 'hidden',
          mx: 'auto'
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
                template. Ask questions on any topic and get informative
                responses instantly.
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
                  , a Danish legal AI platform, for a real-world example of AI
                  in action.
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
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              width: '100%',
              px: {
                xs: 1,
                sm: 1,
                md: 2
              },
              py: 1
            }}
          >
            {messages.map((message, index) => (
              <Box
                key={message.id}
                sx={{
                  width: '100%',
                  maxWidth: '700px',
                  mx: 'auto',
                  mb: {
                    lg: index === messages.length - 1 ? 1 : 0.5,
                    xl: index === messages.length - 1 ? 0 : 0.5
                  },
                  padding: {
                    xs: '0px',
                    sm: '0px',
                    md: '2px',
                    lg: '1px',
                    xl: '1px'
                  }
                }}
              >
                {message.display}
              </Box>
            ))}
            <ChatScrollAnchor trackVisibility />
          </Box>
        )}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            alignItems: 'center',
            maxWidth: '700px',
            mx: 'auto',
            width: '100%',
            marginTop: 'auto',
            pb: '8px',
            px: {
              xs: '4px',
              sm: '4px',
              md: '12px'
            },
            '@media (min-width: 2000px)': {
              px: '2px',
              maxWidth: '725px'
            },
            gap: 1,
            display: 'flex',
            flexDirection: 'row',
            position: 'sticky'
          }}
        >
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
                borderRadius: '16px',
                pt: {
                  xs: 0.5,
                  sm: 0.5,
                  md: 0.5,
                  lg: 0.75,
                  xl: 0.75
                },
                pb: {
                  xs: 0.5,
                  sm: 0.5,
                  md: 0.5,
                  lg: 0.75,
                  xl: 0.75
                },
                '& .MuiOutlinedInput-inputMultiline': {
                  padding: '0px'
                }
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
            <Box>
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
                    setSelectedModel(
                      event.target.value as 'claude3' | 'chatgpt4'
                    )
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
            </Box>
          )}
        </Box>
      </Box>
    </ErrorBoundary>
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
