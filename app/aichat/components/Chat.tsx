'use client';

import type { FC, KeyboardEvent } from 'react';
import React, { useMemo, useState } from 'react';
import { useChat, type Message } from '@ai-sdk/react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import type { Options as HighlightOptions } from 'rehype-highlight';
import rehypeHighlight from 'rehype-highlight';
import { v4 as uuidv4 } from 'uuid';
import 'highlight.js/styles/github-dark.css';
import {
  Box,
  Typography,
  ListItem,
  List,
  Snackbar,
  Alert,
  TextField,
  Menu,
  MenuItem,
  Button,
  IconButton,
  Paper,
  CircularProgress,
  Grid2,
  InputAdornment,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Link as MuiLink,
  type SxProps,
  type Theme
} from '@mui/material';
import {
  Person as PersonIcon,
  Android as AndroidIcon,
  Send as SendIcon,
  Replay as RetryIcon,
  Stop as StopIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle as CheckCircleIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon
} from '@mui/icons-material';
import type { Tables } from '@/types/database';
import Link from 'next/link';
import { useSWRConfig } from 'swr';
import { ChatScrollAnchor } from '../hooks/chat-scroll-anchor';
import { setModelSettings } from '../actions';

const highlightOptionsAI: HighlightOptions = {
  detect: true,
  prefix: 'hljs-'
};

type MessageFromDB = Pick<
  Tables<'chat_messages'>,
  'id' | 'content' | 'is_user_message' | 'created_at'
>;

type ChatSessionWithMessages = Pick<
  Tables<'chat_sessions'>,
  'id' | 'user_id' | 'created_at' | 'updated_at'
> & {
  chat_messages: MessageFromDB[];
};

interface ChatProps {
  currentChat?: ChatSessionWithMessages | null;
  chatId?: string;
  initialModelType: string;
  initialSelectedOption: string;
}

const messageStyles: Record<string, SxProps<Theme>> = {
  userMessage: {
    background: '#daf8cb',
    color: '#203728',
    position: 'relative',
    borderRadius: '8px',
    margin: '8px 0',
    alignSelf: 'flex-start',
    wordBreak: 'break-word',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
  } as const,
  aiMessage: {
    position: 'relative',
    background: '#f0f0f0',
    color: '#2c3e50',
    borderRadius: '8px',
    margin: '8px 0',
    alignSelf: 'flex-start',
    wordBreak: 'break-word',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
  } as const
};

interface ChatMessageProps {
  messages: Message[];
}

const MessageComponent = ({ message }: { message: Message }) => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = (str: string): void => {
    void window.navigator.clipboard.writeText(str);
  };

  const handleCopy = (content: string) => {
    copyToClipboard(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1000);
  };

  return (
    <ListItem
      sx={
        message.role === 'user'
          ? messageStyles.userMessage
          : messageStyles.aiMessage
      }
    >
      <Box
        sx={{
          position: 'absolute',
          top: '2px',
          left: '2px'
        }}
      >
        {message.role === 'user' ? (
          <PersonIcon sx={{ color: '#4caf50' }} />
        ) : (
          <AndroidIcon sx={{ color: '#607d8b' }} />
        )}
      </Box>
      {message.role === 'assistant' && (
        <Box
          sx={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24
          }}
          onClick={() => handleCopy(message.content)}
        >
          {isCopied ? (
            <CheckCircleIcon fontSize="inherit" />
          ) : (
            <ContentCopyIcon fontSize="inherit" />
          )}
        </Box>
      )}

      {message.role === 'user' ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeHighlight]}
        >
          {message.content}
        </ReactMarkdown>
      ) : (
        <ReactMarkdown
          components={{
            a: ({ href, children }) => (
              <MuiLink
                component={Link}
                href={href ?? '#'}
                target="_blank"
                rel="noopener"
              >
                {children}
              </MuiLink>
            ),

            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className ?? '');
              const language = match?.[1] ? match[1] : '';
              const inline = !language;
              if (inline) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }

              return (
                <div
                  style={{
                    position: 'relative',
                    borderRadius: '5px',
                    paddingTop: '20px',
                    width: '100%'
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '0',
                      left: '5px',
                      fontSize: '0.8em',
                      textTransform: 'uppercase'
                    }}
                  >
                    {language}
                  </span>

                  <pre style={{ margin: '0', overflowX: 'auto' }}>
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              );
            }
          }}
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[[rehypeHighlight, highlightOptionsAI]]}
        >
          {message.content}
        </ReactMarkdown>
      )}
    </ListItem>
  );
};

const ChatMessage: FC<ChatMessageProps> = ({ messages }) => {
  return (
    <>
      {messages.map((message, index) => (
        <MessageComponent key={`${message.id}-${index}`} message={message} />
      ))}
    </>
  );
};

// The rest of the ChatComponent remains unchanged.
const ChatComponent: FC<ChatProps> = ({
  currentChat,
  chatId,
  initialModelType,
  initialSelectedOption
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const { mutate } = useSWRConfig();

  const initialMessages = useMemo(() => {
    if (currentChat) {
      return currentChat.chat_messages.map(
        (message): Message => ({
          role: message.is_user_message ? 'user' : 'assistant',
          id: message.id,
          content: message.content ?? '' // Handle null content
        })
      );
    }
    return [];
  }, [currentChat]);

  const [modelType, setModelType] = useState(initialModelType);
  const [selectedOption, setSelectedOption] = useState(initialSelectedOption);

  const apiEndpoint = modelType === 'perplex' ? '/api/perplexity' : '/api/chat';
  const createChatId = uuidv4();
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    reload,
    stop
  } = useChat({
    api: apiEndpoint,
    body: {
      chatId: chatId ?? createChatId,
      option: selectedOption
    },
    experimental_throttle: 100,
    initialMessages: initialMessages,
    onFinish: async () => {
      if (!chatId) {
        // Only redirect if it's a new chat
        const existingParams = searchParams.toString();
        const newUrl = `${pathname}/${createChatId}${
          existingParams ? `?${existingParams}` : ''
        }`;
        router.replace(newUrl, {
          scroll: false
        });
        await mutate((key) => Array.isArray(key) && key[0] === 'chatPreviews');
      }
    },
    onError: (error) => {
      let message = 'An error occurred, please try again';
      if (error.message.includes('timeout')) {
        message = 'Timeout error, please try again';
      }
      setErrorMessage(message);
      setSnackbarOpen(true);
    }
  });
  const handleModelTypeChange = async (newValue: string | null) => {
    const newModelType = newValue ?? 'standart';
    setModelType(newModelType);
    await setModelSettings(newModelType, selectedOption);
  };

  const handleOptionChange = async (newValue: string | null) => {
    const newOption = newValue ?? 'gpt-3.5-turbo-1106';
    setSelectedOption(newOption);
    await setModelSettings(modelType, newOption);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && event.shiftKey) {
      // Allow newline on Shift + Enter
    } else if (event.key === 'Enter') {
      // Prevent default behavior and submit form on Enter only
      event.preventDefault();
      handleSubmit(event);
    }
  };

  const modelTypes = ['standart', 'perplex'];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: {
          xs: '100vh',
          sm: '100vh',
          md: 'calc(100vh - 44px)' // 44px is the height of the app bar so we subtract it from the viewport height
        },
        width: '100%',
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
            height: '90vh',
            textAlign: 'center'
          }}
        >
          <Typography variant="h4" color="textSecondary" sx={{ pb: 2 }}>
            Chat with our AI Assistant
          </Typography>

          <Typography variant="body1" color="textSecondary" sx={{ pb: 2 }}>
            Experience the power of AI-driven conversations with our chat
            template. Ask questions on any topic and get informative responses
            instantly.
          </Typography>
          <Typography
            variant="body1"
            color="textSecondary"
            fontWeight="bold"
            sx={{ pb: 2 }}
          >
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
          </Typography>
          <Typography variant="h4" color="textSecondary">
            Start chatting now and enjoy the AI experience!
          </Typography>
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          <List
            sx={{
              flex: 1,
              overflowY: 'auto',
              width: '100%',
              mx: 'auto',
              maxWidth: '1000px',
              padding: {
                xs: '0px',
                sm: '0px',
                md: '2px',
                lg: '4px',
                xl: '8px'
              }
            }}
          >
            <ChatMessage messages={messages} />
            <ChatScrollAnchor trackVisibility />
          </List>
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
            maxWidth: '850px'
          },
          display: 'flex',
          flexDirection: 'row',
          position: 'sticky'
        }}
      >
        <Paper
          elevation={4}
          sx={{
            backgroundColor: 'lightgray',

            maxWidth: 1000,
            borderRadius: '20px',
            height: 'auto',
            width: '100%'
          }}
        >
          <TextField
            value={input}
            size="small"
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            variant="outlined"
            multiline
            maxRows={4}
            disabled={isLoading}
            fullWidth
            autoFocus
            sx={{
              '.MuiOutlinedInput-root': {
                backgroundColor: 'white',
                borderRadius: '20px',
                '& .MuiOutlinedInput-inputMultiline': {
                  padding: '0px'
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.23)'
                }
              },
              '& .MuiInputLabel-root': {
                top: -4,
                left: -4
              }
            }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    {messages.length > 0 && (
                      <IconButton
                        onClick={async () => {
                          await reload();
                        }}
                        disabled={isLoading}
                        color="primary"
                      >
                        <RetryIcon />
                      </IconButton>
                    )}
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
                      <IconButton
                        aria-label="send message"
                        color="primary"
                        type="submit"
                        disabled={isLoading}
                      >
                        <SendIcon />
                      </IconButton>
                    )}
                  </InputAdornment>
                )
              }
            }}
          />
          <Grid2
            container
            direction="row"
            sx={{
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            {modelType === 'standart' && (
              <Grid2
                size={{
                  xs: 4.8,
                  sm: 4.8,
                  md: 5,
                  lg: 4,
                  xl: 4
                }}
              >
                <Button
                  id="model-button"
                  aria-controls={open ? 'model-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={open ? 'true' : undefined}
                  onClick={handleClick}
                  endIcon={<KeyboardArrowDownIcon />}
                  sx={{
                    ml: 1,
                    my: 0.5,
                    borderRadius: '20px',
                    width: '100%',
                    backgroundColor: 'white',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#f5f5f5'
                    },
                    justifyContent: 'space-between',
                    padding: '8px 14px'
                  }}
                >
                  {selectedOption}
                </Button>
                <Menu
                  id="model-menu"
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleClose}
                  MenuListProps={{
                    'aria-labelledby': 'model-button'
                  }}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'left'
                  }}
                  transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left'
                  }}
                >
                  {[
                    'gpt-3.5-turbo-1106',
                    'gpt-3.5-turbo-16k',
                    'gpt-4-0125-preview',
                    'gpt-4-1106-preview',
                    'gpt-4',
                    'sonnet-3-5'
                  ].map((option) => (
                    <MenuItem
                      key={option}
                      onClick={async () => {
                        await handleOptionChange(option);
                        handleClose();
                      }}
                      selected={selectedOption === option}
                      sx={{
                        minWidth: '200px',
                        '&.Mui-selected': {
                          backgroundColor: '#e3f2fd',
                          '&:hover': {
                            backgroundColor: '#bbdefb'
                          }
                        }
                      }}
                    >
                      {option}
                    </MenuItem>
                  ))}
                </Menu>
              </Grid2>
            )}
            <Grid2
              size={{
                xs: 7,
                sm: 7,
                md: 6,
                lg: 4,
                xl: 4
              }}
            >
              <FormControl component="fieldset" sx={{ width: '100%', pl: 2 }}>
                <RadioGroup
                  aria-label="model-type"
                  name="model-type"
                  defaultValue="standart"
                  value={modelType}
                  onChange={(_, newValue) => handleModelTypeChange(newValue)}
                  row
                >
                  {modelTypes.map((model) => (
                    <FormControlLabel
                      key={model}
                      value={model}
                      control={<Radio />}
                      label={model}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Grid2>
          </Grid2>
        </Paper>
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="error"
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChatComponent;
