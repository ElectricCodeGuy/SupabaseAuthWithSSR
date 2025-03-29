'use client';

import type { KeyboardEvent } from 'react';
import React, { useState, useOptimistic, startTransition } from 'react';
import { useChat, type Message } from '@ai-sdk/react';
import {
  useRouter,
  usePathname,
  useSearchParams,
  useParams
} from 'next/navigation';
import { useSWRConfig } from 'swr';
import { ChatScrollAnchor } from '../hooks/chat-scroll-anchor';
import { setModelSettings } from '../actions';
import Link from 'next/link';

// Shadcn UI components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import ChatMessage from './MemoizedMarkdown';
// Icons from Lucide React
import { Send, RotateCw, Loader2, ChevronDown } from 'lucide-react';

import type { Tables } from '@/types/database';

type ChatSessionWithMessages = Pick<
  Tables<'chat_sessions'>,
  'id' | 'user_id' | 'created_at' | 'updated_at'
> & {
  chat_messages: Message[];
};

interface ChatProps {
  currentChat?: ChatSessionWithMessages | null;
  chatId: string;
  initialModelType: string;
  initialSelectedOption: string;
}

const ChatComponent: React.FC<ChatProps> = ({
  currentChat,
  chatId,
  initialModelType,
  initialSelectedOption
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const param = useParams();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const currentChatId = param.id as string;

  const [optimisticModelType, setOptimisticModelType] = useOptimistic<
    string,
    string
  >(initialModelType, (_, newValue) => newValue);

  const [optimisticOption, setOptimisticOption] = useOptimistic<string, string>(
    initialSelectedOption,
    (_, newValue) => newValue
  );

  const handleModelTypeChange = async (newValue: string) => {
    startTransition(async () => {
      setOptimisticModelType(newValue);
      await setModelSettings(newValue, optimisticOption);
    });
  };

  const handleOptionChange = async (newValue: string) => {
    startTransition(async () => {
      setOptimisticOption(newValue);
      await setModelSettings(optimisticModelType, newValue);
    });
  };

  // Generate chat ID and determine API endpoint

  // Determine API endpoint based on model type
  const getApiEndpoint = () => {
    switch (optimisticModelType) {
      case 'perplex':
        return '/api/perplexity';
      case 'website':
        return '/api/websitechat';
      default:
        return '/api/chat';
    }
  };

  const apiEndpoint = getApiEndpoint();

  // Get messages from chat
  const { messages } = useChat({
    id: 'chat',
    api: apiEndpoint,
    body: {
      chatId: chatId,
      option: optimisticOption
    },
    experimental_throttle: 50,
    initialMessages: currentChat?.chat_messages,
    onFinish: async () => {
      if (chatId === currentChatId) return;
      const existingParams = searchParams.toString();
      const newUrl = `${pathname}/${chatId}${
        existingParams ? `?${existingParams}` : ''
      }`;
      router.replace(newUrl, { scroll: false });
      await mutate((key) => Array.isArray(key) && key[0] === 'chatPreviews');
    },

    onError: (error) => {
      if (error.message.includes('timeout')) {
        console.error('Timeout error, please try again');
      }
    }
  });

  const modelTypes = [
    { value: 'standart', label: 'Standard' },
    { value: 'perplex', label: 'Perplexity' },
    { value: 'website', label: 'Website' }
  ];
  const { mutate } = useSWRConfig();

  return (
    <div className="flex flex-col h-screen md:h-[calc(100vh-48px)] w-full mx-auto">
      {messages.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-[90vh] text-center px-4">
          <h2 className="text-2xl font-semibold text-foreground/80 pb-2">
            Chat with our AI Assistant
          </h2>

          <p className="text-muted-foreground pb-2 max-w-2xl">
            Experience the power of AI-driven conversations with our chat
            template. Ask questions on any topic and get informative responses
            instantly.
          </p>
          <p className="font-bold text-foreground/80 pb-2">
            Check out{' '}
            <Link
              href="https://www.lovguiden.dk/"
              target="_blank"
              rel="noopener"
              className="text-xl text-primary hover:underline"
            >
              Lovguiden
            </Link>
            , a Danish legal AI platform, for a real-world example of AI in
            action.
          </p>
          <h2 className="text-2xl font-semibold text-foreground/80">
            Start chatting now and enjoy the AI experience!
          </h2>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <ul className="flex-1 overflow-y-auto w-full mx-auto max-w-[1000px] px-0 md:px-1 lg:px-4">
            <ChatMessage messages={messages} />
            <ChatScrollAnchor trackVisibility />
          </ul>
        </div>
      )}

      <div className="sticky bottom-0 mt-auto pb-2 max-w-[800px] mx-auto w-full">
        <Card className="bg-gradient-to-r from-background/50 to-muted rounded-2xl w-full border-border shadow-md py-1">
          <CardContent className="px-1">
            <MessageInput
              chatId={chatId}
              apiEndpoint={apiEndpoint}
              option={optimisticOption}
              messagesLength={messages.length}
            />

            <div className="flex justify-between items-center mt-2 px-1 py-1 gap-2">
              {/* Model Type Select */}
              <div className="flex-1 max-w-[180px]">
                <Select
                  value={optimisticModelType}
                  onValueChange={handleModelTypeChange}
                >
                  <SelectTrigger className="w-full h-9 text-sm bg-background/80 hover:bg-background border-border transition-all duration-200">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {modelTypes.map((model) => (
                      <SelectItem
                        key={model.value}
                        value={model.value}
                        className="text-sm"
                      >
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Model Options Dropdown - only shown for standard model */}
              {optimisticModelType === 'standart' && (
                <div className="flex-1 ml-2">
                  <DropdownMenu
                    open={dropdownOpen}
                    onOpenChange={setDropdownOpen}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full rounded-lg bg-background/80 hover:bg-background hover:shadow-sm justify-between px-4 py-2 text-sm border-border transition-all duration-200"
                      >
                        <span className="truncate">{optimisticOption}</span>
                        <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 rounded-lg shadow-lg border-border bg-popover/95 backdrop-blur-sm">
                      {[
                        'gpt-3.5-turbo-1106',
                        'gpt-3.5-turbo-16k',
                        'gpt-4-0125-preview',
                        'gpt-4-1106-preview',
                        'gpt-4',
                        'sonnet-3-7'
                      ].map((option) => (
                        <DropdownMenuItem
                          key={option}
                          onClick={() => handleOptionChange(option)}
                          className={`rounded-md my-0.5 transition-colors duration-200 ${
                            optimisticOption === option
                              ? 'bg-primary/20 text-primary font-medium'
                              : 'hover:bg-muted'
                          }`}
                        >
                          {option}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Separate message input component, to avoid re-rendering the chat messages when typing
const MessageInput = ({
  chatId,
  apiEndpoint,
  option,
  messagesLength
}: {
  chatId: string;
  apiEndpoint: string;
  option: string;
  messagesLength: number;
}) => {
  const { input, handleInputChange, handleSubmit, status, stop, reload } =
    useChat({
      id: 'chat', // Use the same ID to share state
      api: apiEndpoint,
      body: {
        chatId,
        option
      }
    });

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && event.shiftKey) {
      // Allow newline on Shift + Enter
    } else if (event.key === 'Enter') {
      // Prevent default behavior and submit form on Enter only
      event.preventDefault();
      handleSubmit(event);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="relative">
        <Textarea
          value={input}
          onChange={(e) => handleInputChange(e)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={status !== 'ready'}
          className="min-h-12 resize-none rounded-xl pr-24 bg-background/90 backdrop-blur-sm border-input/30 focus:border-primary focus:ring-2 focus:ring-primary/30 p-4 text-base transition-all duration-200 shadow-inner"
          autoFocus
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
          {messagesLength > 0 && (
            <Button
              onClick={() => reload()}
              disabled={status !== 'ready'}
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-primary hover:bg-primary/10 rounded-full transition-colors duration-200"
              type="button"
              title="Regenerate response"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          )}

          {status !== 'ready' ? (
            <Button
              onClick={stop}
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors duration-200"
              type="button"
              title="Stop generating"
            >
              {status === 'submitted' && (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
              )}
              {status === 'streaming' && <Loader2 className="animate-spin" />}
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={status !== 'ready' || !input.trim()}
              variant="default"
              size="icon"
              className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200 shadow-md"
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};

export default ChatComponent;
