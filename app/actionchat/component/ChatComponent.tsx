'use client';
import React, { useState, KeyboardEvent } from 'react';
import { useUIState, useActions, readStreamableValue } from 'ai/rsc';
import { type AI } from '../action_chat/AIProvider';
import { UserMessage } from './ChatWrapper';
import {
  IconButton,
  InputAdornment,
  TextField,
  Box,
  CircularProgress,
  Typography,
  Tooltip,
  FormControl,
  Select,
  Link as MuiLink,
  MenuItem,
  Popover,
  Button
} from '@mui/material';
import {
  Send as SendIcon,
  Stop as StopIcon,
  Chat as ChatIcon,
  PictureAsPdf as PdfIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { ChatScrollAnchor } from '../hooks/chat-scroll-anchor';
import { Tables } from '@/types/database';
import ErrorBoundary from './ErrorBoundary';
import { useUpload } from '../context/uploadContext'; // Add this import
import Link from 'next/link';
import { useSWRConfig } from 'swr';

type UserData = Pick<Tables<'users'>, 'email' | 'full_name'>;

interface ChatComponentPageProps {
  userInfo: UserData | null;
}

export default function ChatComponentPage({
  userInfo
}: ChatComponentPageProps) {
  const [inputValue, setInputValue] = useState('');
  const router = useRouter();
  const [messages, setMessages] = useUIState<typeof AI>();
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    success: boolean;
    message?: string;
    reset?: number;
  } | null>(null);
  const { submitMessage, uploadFilesAndQuery, SearchTool } =
    useActions<typeof AI>();
  const { selectedBlobs, selectedMode, setSelectedMode } = useUpload();

  const [selectedModel, setSelectedModel] = useState<'claude3' | 'chatgpt4'>(
    'claude3'
  );
  const [loadingState, setLoadingState] = useState<'searching' | 'done' | null>(
    null
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
  const { id } = useParams();
  const currentChatId = (id as string) || '';
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && event.shiftKey) {
      // Allow newline on Shift + Enter
    } else if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  const { mutate } = useSWRConfig();
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
        {/* Add the model selector at the top */}
        {userInfo && (
          <FormControl
            size="small"
            variant="standard"
            sx={{
              maxWidth: 120,
              backgroundColor: 'white',
              borderRadius: 1,
              m: 1,
              alignSelf: {
                xs: 'flex-end',
                sm: 'flex-end',
                md: 'flex-start'
              }
            }}
          >
            <Select
              labelId="model-select-label"
              id="model-select"
              value={selectedModel}
              label="Model"
              onChange={(event) =>
                setSelectedModel(event.target.value as 'claude3' | 'chatgpt4')
              }
              size="small"
            >
              <MenuItem value="claude3" sx={{ fontSize: '0.875rem' }}>
                Claude
              </MenuItem>
              <MenuItem value="chatgpt4" sx={{ fontSize: '0.875rem' }}>
                GPT-4
              </MenuItem>
            </Select>
          </FormControl>
        )}
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
              variant="h4"
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

              {/* Add this new Typography section for Tavily */}
              <Typography
                variant="body1"
                sx={{
                  color: 'textSecondary',
                  mb: 2,
                  maxWidth: '600px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: 2,
                  backgroundColor: 'rgba(25, 118, 210, 0.04)'
                }}
              >
                <strong>🔍 Web Search Mode:</strong> Powered by{' '}
                <MuiLink
                  href="https://tavily.com/"
                  target="_blank"
                  rel="noopener"
                  style={{ color: 'blue' }}
                >
                  Tavily AI
                </MuiLink>
                , our search feature provides real-time, accurate information
                from across the web. Get up-to-date answers with reliable
                sources and citations. Perfect for current events,
                fact-checking, and research queries.
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
                      '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' }
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
                      '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' }
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

                <Tooltip title="Web Search Mode (Powered by Tavily AI)">
                  <IconButton
                    onClick={() => setSelectedMode('search')}
                    sx={{
                      width: 80,
                      height: 80,
                      border:
                        selectedMode === 'search'
                          ? '2px solid #1976d2'
                          : '1px solid #ccc',
                      borderRadius: '12px',
                      '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' }
                    }}
                  >
                    <SearchIcon
                      sx={{
                        fontSize: 40,
                        color: selectedMode === 'search' ? '#1976d2' : '#666'
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
        {rateLimitInfo &&
          !rateLimitInfo.success &&
          rateLimitInfo.reset &&
          userInfo && (
            <Box
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                maxWidth: '800px',
                padding: {
                  xs: '1px',
                  sm: '1px',
                  md: '2px',
                  lg: '4px',
                  xl: '4px'
                },
                my: 1,
                textAlign: 'center',
                mx: 'auto'
              }}
            >
              <Typography variant="body1" component="p" sx={{ mb: 1 }}>
                {rateLimitInfo.message}
              </Typography>
              <Typography variant="body2" component="p" sx={{ mb: 1 }}>
                Please wait until{' '}
                {new Date(rateLimitInfo.reset * 1000).toLocaleTimeString()} to
                send more messages.
              </Typography>
              <Button
                component={Link}
                href="#"
                variant="contained"
                color="primary"
                size="small"
                sx={{
                  textTransform: 'none',
                  borderRadius: '8px',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                Buy more credits
              </Button>
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
            disabled={loadingState === 'searching'}
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
                    {loadingState === 'searching' ? (
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
                      <IconButton
                        aria-label="send message"
                        color="primary"
                        onClick={handleSubmit}
                      >
                        <SendIcon />
                      </IconButton>
                    )}
                  </InputAdornment>
                )
              }
            }}
          />
          {messages.length > 0 && (
            <>
              <Tooltip title="Change mode" arrow placement="top">
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
                  ) : selectedMode === 'pdf' ? (
                    <PdfIcon sx={{ width: 24, height: 24 }} />
                  ) : (
                    <SearchIcon sx={{ width: 24, height: 24 }} />
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
                <Box
                  sx={{
                    width: 'fit-content',
                    display: 'flex',
                    flexDirection: 'row'
                  }}
                >
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
                    },
                    {
                      mode: 'search',
                      icon: <SearchIcon sx={{ width: 40, height: 40 }} />,
                      title: 'Web Search'
                    }
                  ].map((item, index) => (
                    <MenuItem
                      key={item.mode}
                      onClick={() => {
                        setSelectedMode(
                          item.mode as 'default' | 'pdf' | 'search'
                        );
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
    setLoadingState('searching');

    let response;

    // Use different query methods based on selected mode
    if (selectedMode === 'pdf') {
      response = await uploadFilesAndQuery(
        inputValue,
        currentChatId || '',
        selectedModel,
        selectedBlobs
      );
    } else if (selectedMode === 'search') {
      response = await SearchTool(
        inputValue,
        selectedModel,
        currentChatId || ''
      );
    } else {
      // Default chat mode
      response = await submitMessage(
        inputValue,
        selectedModel,
        currentChatId || ''
      );
    }

    if (response.success === false) {
      // Only set rate limit info if it's actually a rate limit issue
      if (response.reset) {
        // Rate limit messages typically include a reset timestamp
        setRateLimitInfo({
          success: response.success,
          message: response.message,
          reset: response.reset
        });
      } else {
        // For other errors, just reset the state
        setRateLimitInfo(null);
      }
      setLoadingState(null);
    } else {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          ...response,
          role: 'assistant',
          id: response.id || Date.now(),
          display: response.display
        }
      ]);
    }
    for await (const status of readStreamableValue(response.status)) {
      switch (status) {
        case 'searching':
          setLoadingState('searching');
          break;
        case 'done':
          setLoadingState(null);
          break;
        default:
          setLoadingState(null);
      }
    }
    if (response.chatId && !currentChatId) {
      const currentSearchParams = new URLSearchParams(window.location.search);
      let newUrl = `/actionchat/${response.chatId}`;

      if (currentSearchParams.toString()) {
        newUrl += `?${currentSearchParams.toString()}`;
      }
      // Refresh the chat previews to show the new chat in the list of chats
      mutate((key) => Array.isArray(key) && key[0] === 'chatPreviews');
      router.replace(newUrl, { scroll: false });
      router.refresh();
    }

    setInputValue('');
    setLoadingState(null);
  }
}
