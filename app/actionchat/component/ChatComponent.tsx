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
  MenuItem,
  Popover
} from '@mui/material';
import {
  Send as SendIcon,
  Stop as StopIcon,
  DeleteSweep as DeleteSweepIcon,
  Chat as ChatIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { ChatScrollAnchor } from '../hooks/chat-scroll-anchor';
import { Tables } from '@/types/database';
import ErrorBoundary from './ErrorBoundary';
import { useUpload } from '../context/uploadContext'; // Add this import

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
  const router = useRouter();
  const [messages, setMessages] = useUIState<typeof AI>();
  const [isLoading, setIsLoading] = useState(false);
  const { submitMessage, uploadFilesAndQuery, resetMessages } =
    useActions<typeof AI>();
  const { selectedBlobs, selectedMode, setSelectedMode } = useUpload(); // Add this line

  const [selectedModel, setSelectedModel] = useState<'claude3' | 'chatgpt4'>(
    'claude3'
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Add these handlers
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
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
        router.refresh();
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
              p: 1
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
            <>
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  mt: 4,
                  justifyContent: 'center'
                }}
              >
                <Tooltip title="Regular Chat Mode">
                  <IconButton
                    onClick={() => setSelectedMode('default')}
                    sx={{
                      width: 80,
                      height: 80,
                      border:
                        selectedMode === 'default'
                          ? '2px solid #1976d2'
                          : '1px solid #ccc',
                      borderRadius: '12px',
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.04)'
                      }
                    }}
                  >
                    <ChatIcon
                      sx={{
                        fontSize: 40,
                        color: selectedMode === 'default' ? '#1976d2' : '#666'
                      }}
                    />
                  </IconButton>
                </Tooltip>

                <Tooltip title="PDF Chat Mode">
                  <IconButton
                    onClick={() => setSelectedMode('pdf')}
                    sx={{
                      width: 80,
                      height: 80,
                      border:
                        selectedMode === 'pdf'
                          ? '2px solid #1976d2'
                          : '1px solid #ccc',
                      borderRadius: '12px',
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.04)'
                      }
                    }}
                  >
                    <PdfIcon
                      sx={{
                        fontSize: 40,
                        color: selectedMode === 'pdf' ? '#1976d2' : '#666'
                      }}
                    />
                  </IconButton>
                </Tooltip>
              </Box>

              <Typography
                variant="body2"
                sx={{
                  color: 'textSecondary',
                  mt: 2
                }}
              >
                Select your preferred chat mode
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
            {messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  width: '100%',
                  maxWidth: '700px',
                  mx: 'auto',
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
          {messages.length > 0 && (
            <>
              <Tooltip title="Skift mode" arrow placement="top">
                <IconButton
                  onClick={handleClick}
                  sx={{
                    p: 0.5,
                    height: 'fit-content',
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    borderRadius: '8px',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  {selectedMode === 'default' ? (
                    <ChatIcon sx={{ width: 24, height: 24 }} />
                  ) : (
                    <PdfIcon sx={{ width: 24, height: 24 }} />
                  )}
                </IconButton>
              </Tooltip>
              <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'left'
                }}
                transformOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left'
                }}
              >
                <Box sx={{ width: 300, display: 'flex', flexDirection: 'row' }}>
                  {[
                    {
                      mode: 'default',
                      icon: <ChatIcon sx={{ width: 40, height: 40 }} />,
                      title: 'Regular Chat'
                    },
                    {
                      mode: 'pdf',
                      icon: <PdfIcon sx={{ width: 40, height: 40 }} />,
                      title: 'PDF Chat'
                    }
                  ].map((item, index) => (
                    <MenuItem
                      key={item.mode}
                      onClick={() => {
                        setSelectedMode(item.mode as 'default' | 'pdf');
                        handleClose();
                      }}
                      selected={selectedMode === item.mode}
                      sx={{
                        width: '50%', // Make each item take up 50% of the space
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1,
                        py: 1.5,
                        borderRight:
                          index === 0
                            ? '1px solid rgba(0, 0, 0, 0.12)'
                            : 'none', // Add border between items
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(0, 0, 0, 0.08)',
                          border: '1px solid rgba(0, 0, 0, 0.12)',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.08)'
                          },
                          '& .MuiTypography-root': {
                            color: 'text.primary'
                          }
                        },
                        '&:hover': {
                          backgroundColor:
                            selectedMode === item.mode
                              ? 'rgba(0, 0, 0, 0.08)'
                              : 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                    >
                      <Box
                        sx={{
                          color:
                            selectedMode === item.mode
                              ? 'primary.main'
                              : 'text.secondary'
                        }}
                      >
                        {item.icon}
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: selectedMode === item.mode ? 600 : 400,
                          textAlign: 'center',
                          color: 'text.primary'
                        }}
                      >
                        {item.title}
                      </Typography>
                    </MenuItem>
                  ))}
                </Box>
              </Popover>
            </>
          )}
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

    let responseMessage;

    // Use different query methods based on selected mode
    if (selectedMode === 'pdf') {
      responseMessage = await uploadFilesAndQuery(
        inputValue,
        currentChatId || '',
        selectedModel,
        selectedBlobs
      );
    } else {
      // Default chat mode
      responseMessage = await submitMessage(
        inputValue,
        selectedModel,
        currentChatId || ''
      );
    }

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
