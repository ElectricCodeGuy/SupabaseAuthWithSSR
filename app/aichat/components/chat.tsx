'use client';

import React, {
  useEffect,
  useMemo,
  useState,
  FC,
  KeyboardEvent,
  useCallback
} from 'react';
import { useChat, type Message } from 'ai/react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight, { Options as HighlightOptions } from 'rehype-highlight';
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
  Autocomplete,
  IconButton,
  Paper,
  CircularProgress,
  Grid2,
  InputAdornment,
  Fab,
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
  KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';
import { Tables } from '@/types/database';
import Link from 'next/link';
import { useSWRConfig } from 'swr';
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

  const componentsAI: Partial<Components> = {
    a: ({ href, children }) => (
      <MuiLink
        component={Link}
        href={href || '#'}
        target="_blank"
        rel="noopener"
      >
        {children}
      </MuiLink>
    ),

    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match && match[1] ? match[1] : '';
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
  };

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
          components={componentsAI}
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
const ChatComponent: FC<ChatProps> = ({ currentChat, chatId }) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { mutate } = useSWRConfig();
  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      setShowScrollToTop(scrollTop > 0);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const initialMessages = useMemo(() => {
    if (currentChat && currentChat.chat_messages) {
      return currentChat.chat_messages.map(
        (message): Message => ({
          role: message.is_user_message ? 'user' : 'assistant',
          id: message.id,
          content: message.content || '' // Handle null content
        })
      );
    }
    return [];
  }, [currentChat]);

  const modelType = searchParams.get('modeltype') || 'standart';
  const selectedOption =
    searchParams.get('modelselected') || 'gpt-3.5-turbo-1106';

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
      chatId: chatId || createChatId,
      option: selectedOption
    },
    experimental_throttle: 100,
    initialMessages: initialMessages,
    onFinish: async () => {
      if (!chatId) {
        // Only redirect if it's a new chat
        const existingParams = searchParams.toString();
        const newUrl = `${pathname}/${createChatId}${existingParams ? `?${existingParams}` : ''}`;
        router.replace(newUrl, {
          scroll: false
        });
        mutate((key) => Array.isArray(key) && key[0] === 'chatPreviews');
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

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleModelTypeChange = (newValue: string | null) => {
    const queryString = createQueryString('modeltype', newValue || 'standart');
    router.replace(`?${queryString}`, {
      scroll: false
    });
  };

  const handleOptionChange = (newValue: string | null) => {
    const queryString = createQueryString(
      'modelselected',
      newValue || 'gpt-3.5-turbo-1106'
    );
    router.replace(`?${queryString}`, {
      scroll: false
    });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: {
          xs: '100vh',
          sm: '100vh',
          md: '100vh'
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
                lg: '1px',
                xl: '1px'
              }
            }}
          >
            <ChatMessage messages={messages} />
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
                    <IconButton
                      onClick={async () => {
                        reload();
                      }}
                      disabled={isLoading}
                      color="primary"
                    >
                      <RetryIcon />
                    </IconButton>
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
                <Autocomplete
                  options={[
                    'gpt-3.5-turbo-1106',
                    'gpt-3.5-turbo-16k',
                    'gpt-4-0125-preview',
                    'gpt-4-1106-preview',
                    'gpt-4',
                    'claude3-opus'
                  ]}
                  size="small"
                  value={selectedOption}
                  onChange={(_, newValue) => handleOptionChange(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="AI Model"
                      margin="normal"
                      variant="outlined"
                      slotProps={{
                        input: {
                          ...params.InputProps,
                          style: { borderRadius: 20, backgroundColor: 'white' }
                        }
                      }}
                    />
                  )}
                  sx={{
                    width: '100%',
                    '.MuiAutocomplete-root .MuiOutlinedInput-root': {
                      padding: '8px',
                      '.MuiInputBase-input': {
                        padding: '10px 14px'
                      }
                    }
                  }}
                  disableClearable
                />
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
      {showScrollToTop && (
        <Fab
          color="primary"
          size="small"
          onClick={handleScrollToTop}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 64,
            zIndex: 1000
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      )}
    </Box>
  );
};

export default ChatComponent;
