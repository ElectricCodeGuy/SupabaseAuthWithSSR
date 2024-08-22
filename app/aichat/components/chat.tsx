'use client';

import React, {
  useEffect,
  useMemo,
  useState,
  memo,
  FC,
  FormEvent,
  KeyboardEvent,
  useCallback
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
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import MuiLink from '@mui/material/Link';

const highlightOptionsAI: HighlightOptions = {
  detect: true,
  prefix: 'hljs-'
};

type MessageFromDB = {
  id: string;
  prompt: string[];
  completion: string[];
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
  currentChat?: MessageFromDB | null;
  chatId?: string;
}
interface ChatMessageProps {
  messages: Message[];
}
// Memoizing the Message component with React.memo
// This optimization helps prevent unnecessary re-renders of the Message component.
// React.memo will only re-render the component if its props change.
// In this case, the Message component will only re-render when the 'message' prop changes.
// This can improve performance by reducing the number of unnecessary re-renders.
const MemoizedMessage = memo(({ message }: { message: Message }) => {
  const [isCopied, setIsCopied] = useState(false);
  const router = useRouter();
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
          top: '10px',
          left: '10px'
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
      <Box sx={{ overflowWrap: 'break-word' }}>
        <Typography
          variant="caption"
          sx={{ fontWeight: 'bold', display: 'block' }}
        >
          {message.role === 'user' ? 'You' : 'AI'}
        </Typography>
        {message.role === 'user' ? (
          <ReactMarkdown
            components={componentsUser}
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
      </Box>
    </ListItem>
  );
});

MemoizedMessage.displayName = 'MemoizedMessage';

const ChatMessage: FC<ChatMessageProps> = ({ messages }) => {
  return (
    <>
      {messages.map((message, index) => (
        <MemoizedMessage key={`${message.id}-${index}`} message={message} />
      ))}
    </>
  );
};

const ChatComponent: FC<ChatProps> = ({ currentChat, chatId }) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [chatIdToAppend, setChatIdToAppend] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

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
      const userMessages = currentChat.prompt;
      const assistantMessages = currentChat.completion;
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

  const modelType = searchParams.get('modeltype') || 'standart';
  const selectedOption =
    searchParams.get('modelselected') || 'gpt-3.5-turbo-1106';

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
    body: {
      chatId: chatId === '1' ? '' : chatId,
      option: selectedOption
    },
    initialMessages: initialMessages,
    onResponse: (res) => {
      if (res.status === 200) {
        const chatIdHeader = res.headers.get('x-chat-id');
        const isNewChat = res.headers.get('x-new-chat');
        if (chatIdHeader && isNewChat === 'true') {
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
      const newQueryParams = new URLSearchParams();
      if (searchParams.has('modeltype')) {
        newQueryParams.set(
          'modeltype',
          searchParams.get('modeltype') ?? 'standart'
        );
      }
      if (searchParams.has('modelselected')) {
        newQueryParams.set(
          'modelselected',
          searchParams.get('modelselected') ?? 'gpt-3.5-turbo-1106'
        );
      }
      const newUrl = `${pathname}/${chatIdToAppend}?${newQueryParams.toString()}`;
      router.replace(newUrl, {
        scroll: false
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    router.replace(`${pathname}?${queryString}`, {
      scroll: false
    });
  };

  const handleOptionChange = (newValue: string | null) => {
    const queryString = createQueryString(
      'modelselected',
      newValue || 'gpt-3.5-turbo-1106'
    );
    router.replace(`${pathname}?${queryString}`, {
      scroll: false
    });
  };

  return (
    <Container
      sx={{
        maxHeight: '100vh',
        maxWidth: { lg: 'md', xl: 'lg' },
        overflow: 'auto'
      }}
    >
      {messages.length === 0 ? (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          height="90vh"
          textAlign="center"
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
        <List
          sx={{
            marginBottom: '120px'
          }}
        >
          <ChatMessage messages={messages} />
        </List>
      )}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          position: 'fixed',
          left: {
            xs: '50%',
            sm: '50%',
            md: 'calc(50% - 175px)',
            lg: 'calc(50% - 175px)',
            xl: 'calc(50% - 175px)'
          },
          transform: 'translateX(-50%)',
          bottom: 0,
          zIndex: 1100,
          display: 'flex',
          justifyContent: 'center',
          padding: '2px',
          marginBottom: '8px',
          width: {
            xs: '100%',
            sm: '100%',
            md: '60%',
            lg: '55%',
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
            pr: 0.5,
            pl: 0.5,
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
          <Grid
            container
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            gap={0.5}
          >
            {modelType === 'standart' && (
              <Grid item xs={4.8} sm={4.8} md={5} lg={4} xl={4}>
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
            <Grid item xs={7} sm={7} md={6} lg={4} xl={4}>
              <FormControl component="fieldset" sx={{ width: '100%' }}>
                <RadioGroup
                  aria-label="model-type"
                  name="model-type"
                  defaultValue={'standart'}
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
