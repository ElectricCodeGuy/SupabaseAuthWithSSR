'use client';

import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  FC,
  memo,
  FormEvent,
  KeyboardEvent
} from 'react';
import { useChat, Message } from 'ai/react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ListItem from '@mui/material/ListItem';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import ReactMarkdown, { Options, Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight, { Options as HighlightOptions } from 'rehype-highlight';
import type { User } from '@supabase/supabase-js';
import ChatInputField from './chatInput';
import List from '@mui/material/List';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import PersonIcon from '@mui/icons-material/Person';
import AndroidIcon from '@mui/icons-material/Android';
import 'highlight.js/styles/github-dark.css';

const highlightOptionsAI: HighlightOptions = {
  detect: true,
  prefix: 'hljs-'
};

type MessageFromDB = {
  id: string;
  prompt: string;
  completion: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

const messageStyles = {
  userMessage: {
    position: 'relative', // Add this line
    background: '#daf8cb',
    color: '#203728',
    padding: '10px 20px',
    paddingLeft: '40px', // Increase left padding to make space for the icon
    borderRadius: '25px',
    margin: '8px 0',
    maxWidth: '80%',
    alignSelf: 'flex-end',
    wordBreak: 'break-word',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
  },
  aiMessage: {
    position: 'relative', // Add this line
    background: '#f0f0f0',
    color: '#2c3e50',
    padding: '10px 20px',
    paddingLeft: '40px', // Increase left padding to make space for the icon
    borderRadius: '25px',
    margin: '8px 0',
    maxWidth: '80%',
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
}
const ChatCompoent: FC<ChatProps> = ({ session, currentChat }) => {
  const token = session?.id;

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const chatId = searchParams.get('chatId') || '';
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedOption, setSelectedOption] =
    useState<string>('gpt-3.5-turbo-1106');
  const [selectedPrompt, setSelectedPrompt] = useState<string>('general');
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
  const modelType = searchParams.get('modelType') || 'openai'; // Default to 'openai'

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
      chatId: chatId,
      option: selectedOption,
      prompt: selectedPrompt
    },
    initialMessages: initialMessages,
    onResponse: (res) => {
      const chatIdHeader = res.headers.get('x-chat-id');
      if (chatIdHeader) {
        const newSearchParams = new URLSearchParams(window.location.search);
        newSearchParams.set('chatId', chatIdHeader);
        router.replace(`${pathname}?${newSearchParams.toString()}`, {
          scroll: false
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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Effect hook to auto-scroll to the bottom of the messages list
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  const MemoizedReactMarkdown: FC<Options> = memo(
    ReactMarkdown,
    (prevProps, nextProps) =>
      prevProps.children === nextProps.children &&
      prevProps.className === nextProps.className
  );
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
            maxWidth: '100%' // Ensure the container fits its parent
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
              overflowX: 'auto', // Enable horizontal scrolling
              maxWidth: '1100px' // Set a fixed maximum width
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
          left: '10px' // Adjust these values as needed
        }}
      >
        {m.role === 'user' ? (
          <PersonIcon sx={{ color: '#4caf50' }} />
        ) : (
          <AndroidIcon sx={{ color: '#607d8b' }} />
        )}
      </Box>
      <Box sx={{ overflowWrap: 'break-word' }}>
        <Typography
          variant="caption"
          sx={{ fontWeight: 'bold', display: 'block' }}
        >
          {m.role === 'user' ? 'You' : 'AI'}
        </Typography>
        {m.role === 'user' ? (
          <MemoizedReactMarkdown
            components={componentsUser}
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeHighlight]}
          >
            {m.content}
          </MemoizedReactMarkdown>
        ) : (
          <MemoizedReactMarkdown
            components={componentsAI}
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[[rehypeHighlight, highlightOptionsAI]]}
          >
            {m.content}
          </MemoizedReactMarkdown>
        )}
      </Box>
    </ListItem>
  ));

  return (
    <Box
      sx={{
        marginTop: '2rem',
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '220px',
        marginRight: '5%'
      }}
    >
      <Box
        sx={{
          width: '70%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <List>{messageElements}</List>
        <Box ref={messagesEndRef} />
        <Box component="form" onSubmit={handleSubmitWithReload} ref={formRef}>
          <ChatInputField
            input={input}
            isLoading={isLoading}
            stop={stop}
            handleInputChange={handleInputChange}
            handleIconClick={handleIconClick}
            handleKeyDown={handleKeyDown}
            selectedModel={selectedOption}
            setSelectedModel={setSelectedOption}
            handleReload={async () => {
              reload();
            }}
            selectedPrompt={selectedPrompt}
            setSelectedPrompt={setSelectedPrompt}
            messageCount={messages.length}
          />
        </Box>
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

export default ChatCompoent;
