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
import { useUpload } from '../context/uploadContext';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';

import MemoizedMarkdown from './tools/MemoizedMarkdown';
import ReasoningContent from './tools/Reasoning';
import SourceView from './tools/SourceView';
import DocumentSearchTool from './tools/DocumentChatTool';
import WebsiteSearchTool from './tools/WebsiteChatTool';

// Icons from Lucide React
import {
  Send,
  RotateCw,
  Loader2,
  ChevronDown,
  User,
  Bot,
  Copy,
  CheckCircle
} from 'lucide-react';

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
  const param = useParams();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const currentChatId = param.id as string;
  const { selectedBlobs } = useUpload();

  const [optimisticModelType, setOptimisticModelType] = useOptimistic<
    string,
    string
  >(initialModelType, (_, newValue) => newValue);
  const [isCopied, setIsCopied] = useState(false);
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
      option: optimisticOption,
      selectedBlobs: selectedBlobs
    },
    experimental_throttle: 50,
    initialMessages: currentChat?.chat_messages,
    onFinish: async () => {
      if (chatId === currentChatId) return;

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
              className="text-xl text-blue-600 dark:text-blue-400 hover:underline"
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
            {messages.map((message, index) => {
              const isUserMessage = message.role === 'user';
              const copyToClipboard = (str: string) => {
                window.navigator.clipboard.writeText(str);
              };
              const handleCopy = (content: string) => {
                copyToClipboard(content);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 1000);
              };

              // First filter the tool invocation parts to check if we need the accordion
              const toolInvocationParts = !isUserMessage
                ? message.parts?.filter(
                    (part) => part.type === 'tool-invocation'
                  ) || []
                : [];

              const hasToolInvocations = toolInvocationParts.length > 0;

              return (
                <li
                  key={`${message.id}-${index}`}
                  className={`relative flex flex-col items-start m-2 rounded-lg shadow-md p-4 break-words ${
                    isUserMessage
                      ? 'bg-primary/10 dark:bg-primary/20 text-foreground'
                      : 'bg-card dark:bg-card/90 text-card-foreground border border-border/30 dark:border-border/20'
                  }`}
                >
                  <div className="absolute top-2 left-2">
                    {isUserMessage ? (
                      <User className="text-primary" size={20} />
                    ) : (
                      <Bot
                        className="text-primary/70 dark:text-primary/80"
                        size={20}
                      />
                    )}
                  </div>

                  {!isUserMessage && (
                    <button
                      className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => handleCopy(message.content)}
                    >
                      {isCopied ? (
                        <CheckCircle
                          size={18}
                          className="text-green-600 dark:text-green-400"
                        />
                      ) : (
                        <Copy size={18} />
                      )}
                    </button>
                  )}

                  <div className="w-full pt-6">
                    {/* Use the switch statement pattern to render different part types */}
                    {message.parts?.map((part, partIndex) => {
                      switch (part.type) {
                        case 'text':
                          return (
                            <MemoizedMarkdown
                              key={`text-${partIndex}`}
                              content={part.text}
                              id={`${
                                isUserMessage ? 'user' : 'assistant'
                              }-text-${message.id}-${partIndex}`}
                            />
                          );

                        case 'reasoning':
                          return !isUserMessage ? (
                            <ReasoningContent
                              key={`reasoning-${partIndex}`}
                              details={part.details}
                              messageId={message.id}
                            />
                          ) : null;

                        case 'source':
                          return !isUserMessage ? (
                            <SourceView
                              key={`source-${partIndex}`}
                              source={part.source}
                            />
                          ) : null;

                        case 'tool-invocation':
                          // Don't render individual tools here - they'll be rendered in the accordion
                          return null;

                        default:
                          return null;
                      }
                    })}

                    {/* Render all tool invocations in a single accordion, outside the switch */}
                    {hasToolInvocations && (
                      <div className="mt-4 pt-2 border-t border-border/40 dark:border-border/30">
                        <Accordion
                          type="single"
                          defaultValue="tool-invocation"
                          collapsible
                          className="w-full"
                        >
                          <AccordionItem
                            value="tool-invocation"
                            className="bg-background/40 dark:bg-background/20 rounded-lg overflow-hidden border border-border/50 dark:border-border/30 shadow-sm"
                          >
                            <AccordionTrigger className="font-bold text-foreground/80 hover:text-foreground py-2 px-3 cursor-pointer">
                              Tools
                            </AccordionTrigger>
                            <AccordionContent className="bg-muted/50 dark:bg-muted/30 p-3 text-sm text-foreground/90 overflow-x-auto max-h-[300px] overflow-y-auto border-t border-border/40 dark:border-border/30">
                              {toolInvocationParts.map((part) => {
                                const toolName = part.toolInvocation.toolName;
                                const toolId = part.toolInvocation.toolCallId;
                                switch (toolName) {
                                  case 'searchUserDocument':
                                    return (
                                      <DocumentSearchTool
                                        key={toolId}
                                        toolInvocation={part.toolInvocation}
                                      />
                                    );
                                  case 'websiteSearchTool':
                                    return (
                                      <WebsiteSearchTool
                                        key={toolId}
                                        toolInvocation={part.toolInvocation}
                                      />
                                    );
                                  default:
                                    return null;
                                }
                              })}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
            <ChatScrollAnchor trackVisibility />
          </ul>
        </div>
      )}

      <div className="sticky bottom-0 mt-auto pb-2 max-w-[800px] mx-auto w-full">
        <Card className="bg-gradient-to-r from-background/70 to-muted/80 dark:from-background/50 dark:to-muted/30 rounded-2xl w-full border-border/50 dark:border-border/30 shadow-md py-1">
          <CardContent className="px-1">
            <MessageInput
              chatId={chatId}
              apiEndpoint={apiEndpoint}
              option={optimisticOption}
              messagesLength={messages.length}
              currentChatId={currentChatId}
            />

            <div className="flex justify-between items-center mt-2 px-1 py-1 gap-2">
              {/* Model Type Select */}
              <div className="flex-1 max-w-[180px]">
                <Select
                  value={optimisticModelType}
                  onValueChange={handleModelTypeChange}
                >
                  <SelectTrigger className="w-full h-9 text-sm bg-background/80 dark:bg-background/60 hover:bg-background dark:hover:bg-background/80 border-border/50 dark:border-border/40 transition-all duration-200">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent className="border-border/50 dark:border-border/30 bg-background/95 dark:bg-background/90 backdrop-blur-sm">
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
                        className="w-full rounded-lg bg-background/80 dark:bg-background/60 hover:bg-background dark:hover:bg-background/80 hover:shadow-sm justify-between px-4 py-2 text-sm border-border/50 dark:border-border/40 transition-all duration-200"
                      >
                        <span className="truncate">{optimisticOption}</span>
                        <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 rounded-lg shadow-lg border-border/50 dark:border-border/30 bg-popover/95 dark:bg-popover/90 backdrop-blur-sm">
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
                              ? 'bg-primary/20 dark:bg-primary/30 text-primary dark:text-primary-foreground font-medium'
                              : 'hover:bg-muted dark:hover:bg-muted/70'
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
  messagesLength,
  currentChatId
}: {
  chatId: string;
  apiEndpoint: string;
  option: string;
  messagesLength: number;
  currentChatId: string;
}) => {
  const { selectedBlobs } = useUpload();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { mutate } = useSWRConfig();
  const { input, handleInputChange, handleSubmit, status, stop, reload } =
    useChat({
      id: 'chat', // Use the same ID to share state
      api: apiEndpoint,
      body: {
        chatId: chatId,
        option: option,
        selectedBlobs: selectedBlobs
      },
      onFinish: async () => {
        if (chatId === currentChatId) return;
        const existingParams = searchParams.toString();
        const newUrl = `${pathname}/${chatId}${
          existingParams ? `?${existingParams}` : ''
        }`;
        router.replace(newUrl, { scroll: false });
        await mutate((key) => Array.isArray(key) && key[0] === 'chatPreviews');
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
          className="min-h-12 resize-none rounded-xl pr-24 bg-background/90 dark:bg-background/80 backdrop-blur-sm border-input/30 dark:border-input/20 focus:border-primary focus:ring-2 focus:ring-primary/30 p-4 text-base transition-all duration-200 shadow-inner"
          autoFocus
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
          {messagesLength > 0 && (
            <Button
              onClick={() => reload()}
              disabled={status !== 'ready'}
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-full transition-colors duration-200"
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
              className="h-9 w-9 rounded-full bg-destructive/10 dark:bg-destructive/20 hover:bg-destructive/20 dark:hover:bg-destructive/30 text-destructive transition-colors duration-200"
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
