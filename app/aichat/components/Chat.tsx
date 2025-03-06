'use client';

import type { KeyboardEvent } from 'react';
import React, { useState, useOptimistic, startTransition } from 'react';
import { useChat, type Message } from '@ai-sdk/react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
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
  chatId?: string;
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
                        'sonnet-3-7'
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
