'use client';

import type { KeyboardEvent } from 'react';
import React, { useState, useOptimistic, startTransition } from 'react';
import { useChat, type Message } from '@ai-sdk/react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import type { Options as HighlightOptions } from 'rehype-highlight';
import rehypeHighlight from 'rehype-highlight';
import { v4 as uuidv4 } from 'uuid';
import 'highlight.js/styles/github-dark.css';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// Icons from Lucide React
import {
  User,
  Bot,
  Send,
  RotateCw,
  Loader2,
  Copy,
  CheckCircle,
  ChevronDown
} from 'lucide-react';

import type { Tables } from '@/types/database';

const highlightOptionsAI: HighlightOptions = {
  detect: true,
  prefix: 'hljs-'
};

type ChatSessionWithMessages = Pick<
  Tables<'chat_sessions'>,
  'id' | 'user_id' | 'created_at' | 'updated_at'
> & {
  chat_messages: Message[];
};

interface ChatProps {
  currentChat?: ChatSessionWithMessages | null;
  chatId?: string;
  initialModelType: string;
  initialSelectedOption: string;
}

interface ChatMessageProps {
  messages: Message[];
}

const MessageComponent = ({ message }: { message: Message }) => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = (str: string) => {
    window.navigator.clipboard.writeText(str);
  };

  const handleCopy = (content: string) => {
    copyToClipboard(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1000);
  };

  // Extract sources from message parts
  const sources = message.parts
    ?.filter((part) => part.type === 'source')
    .map((part) => part.source);

  return (
    <li
      className={`relative flex flex-col items-start m-2 rounded-lg shadow-md ${
        message.role === 'user'
          ? 'bg-[#daf8cb] text-[#203728]'
          : 'bg-[#f0f0f0] text-[#2c3e50]'
      } p-4 break-words`}
    >
      <div className="absolute top-2 left-2">
        {message.role === 'user' ? (
          <User className="text-[#4caf50]" size={20} />
        ) : (
          <Bot className="text-[#607d8b]" size={20} />
        )}
      </div>

      {message.role === 'assistant' && (
        <button
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center"
          onClick={() => handleCopy(message.content)}
        >
          {isCopied ? <CheckCircle size={18} /> : <Copy size={18} />}
        </button>
      )}

      <div className="w-full pt-6">
        {message.role === 'user' ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeHighlight]}
          >
            {message.content}
          </ReactMarkdown>
        ) : (
          <>
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <Link
                    href={`?url=${encodeURIComponent(href || '')}`}
                    scroll={false}
                    prefetch={false}
                    className="text-blue-600 hover:underline"
                  >
                    {children}
                  </Link>
                ),
                table: ({ children }) => (
                  <div className="block py-2">
                    <table className="w-full border-collapse break-normal text-[0.85rem]">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => <thead>{children}</thead>,
                tbody: ({ children }) => <tbody>{children}</tbody>,
                tr: ({ children }) => <tr>{children}</tr>,
                th: ({ children }) => (
                  <th
                    scope="row"
                    className="border border-[#ddd] p-1 text-left text-[0.9em] break-normal font-normal hyphens-auto overflow-wrap-normal"
                  >
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td
                    scope="row"
                    className="border border-[#ddd] p-1 text-left text-[0.9em] break-normal font-normal hyphens-auto overflow-wrap-normal"
                  >
                    {children}
                  </td>
                ),
                p: ({ children }) => (
                  <p className="mb-4 last:mb-0">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-6 mb-4">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-6 mb-4">{children}</ol>
                ),
                li: ({ children }) => <li className="mb-1">{children}</li>,
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4">
                    {children}
                  </blockquote>
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
                    <div className="relative rounded w-full pt-5 my-2">
                      <span className="absolute top-0 left-2 text-xs uppercase">
                        {language}
                      </span>

                      <pre className="m-0 overflow-x-auto">
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

            {/* Display sources if available */}
            {sources && sources.length > 0 && (
              <div className="mt-4 pt-2 border-t border-gray-300">
                <h6 className="font-bold text-gray-600">Sources:</h6>
                <ul className="space-y-1">
                  {sources.map((source, index) => (
                    <li key={index} className="py-0.5">
                      {source.url && (
                        <Link
                          href={`?url=${encodeURIComponent(source.url)}`}
                          scroll={false}
                          prefetch={false}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {source.url}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </li>
  );
};

const ChatMessage: React.FC<ChatMessageProps> = ({ messages }) => {
  return (
    <>
      {messages.map((message, index) => (
        <MessageComponent key={`${message.id}-${index}`} message={message} />
      ))}
    </>
  );
};

const ChatComponent: React.FC<ChatProps> = ({
  currentChat,
  chatId,
  initialModelType,
  initialSelectedOption
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { mutate } = useSWRConfig();

  const [optimisticModelType, setOptimisticModelType] = useOptimistic<
    string,
    string
  >(initialModelType, (_, newValue) => newValue);

  const [optimisticOption, setOptimisticOption] = useOptimistic<string, string>(
    initialSelectedOption,
    (_, newValue) => newValue
  );

  const apiEndpoint =
    optimisticModelType === 'perplex' ? '/api/perplexity' : '/api/chat';
  const createChatId = uuidv4();
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    reload,
    stop
  } = useChat({
    api: apiEndpoint,
    body: {
      chatId: chatId ?? createChatId,
      option: optimisticOption
    },
    experimental_throttle: 100,
    initialMessages: currentChat?.chat_messages,
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
      if (error.message.includes('timeout')) {
        console.error('Timeout error, please try again');
      }
    }
  });

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

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
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
    <div className="flex flex-col h-screen md:h-[calc(100vh-48px)] w-full mx-auto">
      {messages.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-[90vh] text-center px-4">
          <h2 className="text-2xl font-semibold text-gray-600 pb-2">
            Chat with our AI Assistant
          </h2>

          <p className="text-gray-500 pb-2 max-w-2xl">
            Experience the power of AI-driven conversations with our chat
            template. Ask questions on any topic and get informative responses
            instantly.
          </p>
          <p className="font-bold text-gray-600 pb-2">
            Check out{' '}
            <Link
              href="https://www.lovguiden.dk/"
              target="_blank"
              rel="noopener"
              className="text-xl text-blue-600 hover:underline"
            >
              Lovguiden
            </Link>
            , a Danish legal AI platform, for a real-world example of AI in
            action.
          </p>
          <h2 className="text-2xl font-semibold text-gray-600">
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

      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 mt-auto pb-2 max-w-[800px] mx-auto w-full"
      >
        <Card className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl w-full border-none shadow-lg py-1">
          <CardContent className="px-1">
            <div className="relative">
              <Textarea
                value={input}
                onChange={(e) => handleInputChange(e)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={status !== 'ready'}
                className="min-h-12 resize-none rounded-xl pr-24 bg-white/90 backdrop-blur-sm border-transparent focus:border-blue-400 focus:ring-2 focus:ring-blue-300 p-4 text-base transition-all duration-200 shadow-inner"
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                {messages.length > 0 && (
                  <Button
                    onClick={() => reload()}
                    disabled={status !== 'ready'}
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-blue-600 hover:bg-blue-100 rounded-full transition-colors duration-200"
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
                    className="h-9 w-9 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors duration-200"
                    type="button"
                    title="Stop generating"
                  >
                    {status === 'submitted' && (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                    )}
                    {status === 'streaming' && (
                      <Loader2 className="animate-spin" />
                    )}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={status !== 'ready' || !input.trim()}
                    variant="default"
                    size="icon"
                    className="h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 shadow-md"
                    title="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center mt-2 px-1 py-1 gap-2">
              {optimisticModelType === 'standart' && (
                <div className="flex-1 xs:flex-none xs:w-4/12 sm:w-5/12 md:w-5/12 lg:w-4/12 xl:w-4/12">
                  <DropdownMenu
                    open={dropdownOpen}
                    onOpenChange={setDropdownOpen}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full rounded-lg bg-white/80 hover:bg-white hover:shadow-sm justify-between px-4 py-2 text-sm border-gray-200 transition-all duration-200"
                      >
                        <span className="truncate">{optimisticOption}</span>
                        <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 rounded-lg shadow-lg border-gray-200 bg-white/95 backdrop-blur-sm">
                      {[
                        'gpt-3.5-turbo-1106',
                        'gpt-3.5-turbo-16k',
                        'gpt-4-0125-preview',
                        'gpt-4-1106-preview',
                        'gpt-4',
                        'sonnet-3-5'
                      ].map((option) => (
                        <DropdownMenuItem
                          key={option}
                          onClick={() => handleOptionChange(option)}
                          className={`rounded-md my-0.5 transition-colors duration-200 ${
                            optimisticOption === option
                              ? 'bg-blue-100 text-blue-800 font-medium'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {option}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              <div className="flex-1 px-2">
                <RadioGroup
                  defaultValue="standart"
                  value={optimisticModelType}
                  onValueChange={handleModelTypeChange}
                  className="flex space-x-4"
                >
                  {modelTypes.map((model) => (
                    <div key={model} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={model}
                        id={model}
                        className="text-blue-600 border-gray-300 focus:ring-blue-400"
                      />
                      <Label
                        htmlFor={model}
                        className={`text-sm font-medium cursor-pointer ${
                          optimisticModelType === model
                            ? 'text-blue-700'
                            : 'text-gray-600'
                        }`}
                      >
                        {model.charAt(0).toUpperCase() + model.slice(1)}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default ChatComponent;
