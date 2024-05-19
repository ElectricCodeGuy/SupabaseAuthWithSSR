'use client';

import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  FC,
  FormEvent,
  KeyboardEvent
} from 'react';
import { useChat, type Message } from 'ai/react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ListItem from '@mui/material/ListItem';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight, { Options as HighlightOptions } from 'rehype-highlight';
import type { User } from '@supabase/supabase-js';
import List from '@mui/material/List';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import PersonIcon from '@mui/icons-material/Person';
import AndroidIcon from '@mui/icons-material/Android';
import 'highlight.js/styles/github-dark.css';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import RetryIcon from '@mui/icons-material/Replay';
import Paper from '@mui/material/Paper';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';
import StopIcon from '@mui/icons-material/Stop';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Fab from '@mui/material/Fab';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const highlightOptionsAI: HighlightOptions = {
  detect: true,
  prefix: 'hljs-'
};

type MessageFromDB = {
  id: string;
  prompt: string;
  completion: string;
  created_at: string;
  updated_at: string;
};

const messageStyles = {
  userMessage: {
    position: 'relative',
    background: '#daf8cb',
    color: '#203728',
    padding: '10px 20px',
    paddingLeft: '40px',
    borderRadius: '16px',
    margin: '8px 0',
    maxWidth: '100%',
    alignSelf: 'flex-end',
    wordBreak: 'break-word',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
  },
  aiMessage: {
    position: 'relative',
    background: '#f0f0f0',
    color: '#2c3e50',
    padding: '10px 20px',
    paddingLeft: '40px',
    borderRadius: '16px',
    margin: '8px 0',
    maxWidth: '100%',
    alignSelf: 'flex-start',
    wordBreak: 'break-word',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
  }
};

interface ChatProps {
  session: User | null;
  currentChat?: MessageFromDB | null;
  chatId?: string;
}

const ChatComponent: FC<ChatProps> = ({ session, currentChat, chatId }) => {
  const token = session?.id;

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [isCopied, setIsCopied] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [chatIdToAppend, setChatIdToAppend] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedOption, setSelectedOption] =
    useState<string>('gpt-3.5-turbo-1106');

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
    if (currentChat) {
      const userMessages = JSON.parse(currentChat.prompt) as string[];
      const assistantMessages = JSON.parse(currentChat.completion) as string[];
      const combinedMessages: Message[] = [];

      for (
        let i = 0;
        i < Math.max(userMessages.length, assistantMessages.length);
        i++
      ) {
        if (userMessages[i]) {
          combinedMessages.push({
            role: 'user',
            id: `user-${i}`,
            content: userMessages[i]
          });
        }
        if (assistantMessages[i]) {
          combinedMessages.push({
            role: 'assistant',
            id: `assistant-${i}`,
            content: assistantMessages[i]
          });
        }
      }
      return combinedMessages;
    }
    return [];
  }, [currentChat]);

  const modelType = searchParams.get('modelType') || 'openai';

  const apiEndpoint = modelType === 'perplex' ? '/api/perplexity' : '/api/chat';

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
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: {
      chatId: chatId === '1' ? undefined : chatId,
      option: selectedOption
    },
    initialMessages: initialMessages,
    onResponse: (res) => {
      if (res.status === 200) {
        const chatIdHeader = res.headers.get('x-chat-id');
        if (chatIdHeader) {
          setChatIdToAppend(chatIdHeader);
        }
      } else {
        res.json().then((data) => {
          let message = 'En fejl opstod, prøv venligst igen';
          if (data.message) {
            message = data.message;
          }
          setErrorMessage(message);
          setSnackbarOpen(true);
        });
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

  useEffect(() => {
    if (chatIdToAppend && !isLoading && !chatId) {
      router.replace(`${pathname}/${chatIdToAppend}`, {
        scroll: false
      });
    }
  }, [chatIdToAppend, isLoading, pathname, router, chatId]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && event.shiftKey) {
      // Allow newline on Shift + Enter
    } else if (event.key === 'Enter') {
      // Prevent default behavior and submit form on Enter only
      event.preventDefault();
      handleSubmit(event as unknown as FormEvent<HTMLFormElement>);
    }
  };

  const formRef = useRef<HTMLFormElement>(null);

  const handleIconClick = () => {
    const syntheticEvent = new Event('submit', {
      bubbles: true,
      cancelable: true
    }) as unknown as FormEvent<HTMLFormElement>;
    handleSubmit(syntheticEvent);
  };

  const handleSubmitWithReload = async (e: FormEvent<HTMLFormElement>) => {
    handleSubmit(e);
  };

  const componentsAI: Partial<Components> = {
    a: ({ href, children }) => (
      <a
        href={href}
        onClick={(e) => {
          e.preventDefault();
          if (href) {
            router.push(href);
          }
        }}
      >
        {children}
      </a>
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
            padding: '20px',
            marginTop: '20px',
            maxWidth: '100%'
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
          <div
            style={{
              overflowX: 'auto',
              maxWidth: '1100px'
            }}
          >
            <pre style={{ margin: '0' }}>
              <code className={className} {...props}>
                {children}
              </code>
            </pre>
          </div>
        </div>
      );
    }
  };

  const componentsUser: Partial<Components> = {
    a: ({ href, children }) => (
      <a
        href={href}
        onClick={(e) => {
          e.preventDefault();
          if (href) {
            router.push(href);
          }
        }}
      >
        {children}
      </a>
    )
  };
  const copyToClipboard = (str: string): void => {
    void window.navigator.clipboard.writeText(str);
  };
  const handleCopy = (content: string) => {
    copyToClipboard(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1000);
  };

  const messageElements = messages.map((m, index) => (
    <ListItem
      key={`${m.id}-${index}`}
      sx={
        m.role === 'user' ? messageStyles.userMessage : messageStyles.aiMessage
      }
    >
      <Box
        sx={{
          position: 'absolute',
          top: '10px',
          left: '10px'
        }}
      >
        {m.role === 'user' ? (
          <PersonIcon sx={{ color: '#4caf50' }} />
        ) : (
          <AndroidIcon sx={{ color: '#607d8b' }} />
        )}
      </Box>
      {m.role === 'assistant' && (
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
          onClick={() => handleCopy(m.content)}
        >
          {isCopied ? (
            <CheckCircleIcon fontSize="inherit" />
          ) : (
            <ContentCopyIcon fontSize="inherit" />
          )}
        </Box>
      )}
      <Box sx={{ overflowWrap: 'break-word' }}>
        <Typography
          variant="caption"
          sx={{ fontWeight: 'bold', display: 'block' }}
        >
          {m.role === 'user' ? 'You' : 'AI'}
        </Typography>
        {m.role === 'user' ? (
          <ReactMarkdown
            components={componentsUser}
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeHighlight]}
          >
            {m.content}
          </ReactMarkdown>
        ) : (
          <ReactMarkdown
            components={componentsAI}
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[[rehypeHighlight, highlightOptionsAI]]}
          >
            {m.content}
          </ReactMarkdown>
        )}
      </Box>
    </ListItem>
  ));

  const modelTypes = ['openai', 'perplex'];

  const handleModelTypeChange = (
    event: React.SyntheticEvent,
    newValue: string | null
  ) => {
    const newSearchParams = new URLSearchParams(window.location.search);
    newSearchParams.set('modelType', newValue || 'openai');
    router.replace(`${pathname}?${newSearchParams.toString()}`, {
      scroll: false
    });
  };

  return (
    <Container
      sx={{
        minHeight: {
          xs: '90vh',
          sm: '95vh',
          md: '100vh',
          lg: '100vh',
          xl: '100vh'
        },
        maxWidth: { lg: 'md', xl: 'lg' },
        marginBottom: '140px'
      }}
    >
      <List sx={{ width: '100%' }}>{messageElements}</List>

      <Box
        component="form"
        onSubmit={handleSubmitWithReload}
        ref={formRef}
        sx={{
          position: 'fixed',
          left: {
            xs: '50%',
            sm: '50%',
            md: 'calc(50% - 150px)',
            lg: 'calc(50% - 150px)',
            xl: 'calc(50% - 150px)'
          },
          transform: 'translateX(-50%)',
          bottom: 0,
          zIndex: 1100,
          display: 'flex',
          justifyContent: 'center',
          padding: '16px',
          width: {
            xs: '100%',
            sm: '100%',
            md: '65%',
            lg: '60%',
            xl: '100%'
          },
          boxSizing: 'border-box',
          transition: 'left 0.3s ease-in-out',
          maxWidth: 'calc(100% - 32px)',
          mx: 'auto' // Horizontally centering the maxWidth content
        }}
      >
        <Paper
          elevation={4}
          sx={{
            backgroundColor: 'lightgray',
            pr: 1,
            pl: 1,
            paddingBottom: 1,
            maxWidth: 1000,
            borderRadius: '20px',
            height: 'auto',
            width: '100%'
          }}
        >
          <TextField
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            variant="outlined"
            multiline
            maxRows={4}
            disabled={isLoading}
            fullWidth
            autoFocus
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {
                    <IconButton
                      onClick={async () => {
                        reload();
                      }}
                      disabled={isLoading}
                      color="primary"
                    >
                      <RetryIcon />
                    </IconButton>
                  }
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
                      onClick={handleIconClick}
                      disabled={isLoading}
                      color="primary"
                    >
                      <SendIcon />
                    </IconButton>
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
          />
          <Grid container spacing={1} justifyContent="center">
            {modelType === 'openai' && (
              <Grid item xs={6} sm={4}>
                <Autocomplete
                  options={[
                    'gpt-3.5-turbo-1106',
                    'gpt-3.5-turbo-16k',
                    'gpt-4-0125-preview',
                    'gpt-4-1106-preview',
                    'gpt-4'
                  ]}
                  size="small"
                  value={selectedOption}
                  onChange={(
                    event: React.SyntheticEvent,
                    newValue: string | null
                  ) => {
                    setSelectedOption(newValue || '');
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="AI Model"
                      margin="normal"
                      variant="outlined"
                      InputProps={{
                        ...params.InputProps,
                        style: { borderRadius: 20, backgroundColor: 'white' }
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
              </Grid>
            )}
            <Grid item xs={6} sm={4}>
              <Autocomplete
                options={modelTypes}
                value={modelType}
                onChange={handleModelTypeChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Model Type"
                    margin="normal"
                    variant="outlined"
                    InputProps={{
                      ...params.InputProps,
                      style: { borderRadius: 20, backgroundColor: 'white' }
                    }}
                  />
                )}
                size="small"
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
            </Grid>
          </Grid>
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
    </Container>
  );
};

export default ChatComponent;
