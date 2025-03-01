'use client';
import type { KeyboardEvent } from 'react';
import React, { useState } from 'react';
import { useUIState, useActions, readStreamableValue } from 'ai/rsc';
import { type AI } from '../action_chat/shared';
import { UserMessage } from './ChatWrapper';
import { useRouter, useParams } from 'next/navigation';
import { ChatScrollAnchor } from '../hooks/chat-scroll-anchor';
import type { Tables } from '@/types/database';
import ErrorBoundary from './ErrorBoundary';
import { useUpload } from '../context/uploadContext';
import Link from 'next/link';
import { useSWRConfig } from 'swr';

// Shadcn UI components
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

// Lucide icons
import {
  Send,
  StopCircle,
  MessageSquare,
  FileText,
  Search,
  Loader2
} from 'lucide-react';

type UserData = Pick<Tables<'users'>, 'email' | 'full_name'>;

interface ChatComponentPageProps {
  userInfo: UserData | null;
}

export default function ChatComponentPage({
  userInfo
}: ChatComponentPageProps) {
  const [inputValue, setInputValue] = useState('');
  const router = useRouter();
  const [messages, setMessages] = useUIState<AI>();
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    success: boolean;
    message?: string;
    reset?: number;
  } | null>(null);
  const { submitMessage, uploadFilesAndQuery, SearchTool } = useActions<AI>();
  const { selectedBlobs, selectedMode, setSelectedMode } = useUpload();

  const [selectedModel, setSelectedModel] = useState<'claude3' | 'chatgpt4'>(
    'claude3'
  );
  const [loadingState, setLoadingState] = useState<'searching' | 'done' | null>(
    null
  );
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const { id } = useParams();
  const currentChatId = (id as string) || '';

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && event.shiftKey) {
      // Allow newline on Shift + Enter
    } else if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  const { mutate } = useSWRConfig();

  function stop() {
    setLoadingState(null);
  }

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
          <UserMessage full_name={userInfo.full_name || 'Default_user'}>
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
        setRateLimitInfo({
          success: response.success,
          message: response.message,
          reset: response.reset
        });
      } else {
        setRateLimitInfo(null);
      }
      setLoadingState(null);
    } else {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          ...response,
          role: 'assistant',
          id: response.id ?? Date.now(),
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
      mutate((key) => Array.isArray(key) && key[0] === 'chatPreviews');
      router.replace(newUrl, { scroll: false });
      router.refresh();
    }

    setInputValue('');
    setLoadingState(null);
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-[100vh] md:h-[calc(100vh-48px)] overflow-hidden mx-auto relative">
        {/* Model selector */}
        {userInfo && (
          <div className="max-w-[120px] bg-white rounded m-1 absolute self-end md:self-start">
            <Select
              value={selectedModel}
              onValueChange={(value) =>
                setSelectedModel(value as 'claude3' | 'chatgpt4')
              }
            >
              <SelectTrigger className="w-full h-8 text-sm">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="claude3" className="text-sm">
                  Claude
                </SelectItem>
                <SelectItem value="chatgpt4" className="text-sm">
                  GPT-4
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-center p-1">
            <h2 className="text-2xl mb-2 text-gray-500">
              Chat with our AI Assistant
            </h2>
            <p className="text-gray-500 mb-2">
              Experience the power of AI-driven conversations with our chat
              template. Ask questions on any topic and get informative responses
              instantly.
            </p>

            {/* Tavily info */}
            <div className="text-gray-500 mb-2 max-w-[600px] border border-gray-200 rounded-lg p-4 bg-blue-50/30">
              <strong>🔍 Web Search Mode:</strong> Powered by{' '}
              <a
                href="https://tavily.com/"
                target="_blank"
                rel="noopener"
                className="text-blue-600"
              >
                Tavily AI
              </a>
              , our search feature provides real-time, accurate information from
              across the web. Get up-to-date answers with reliable sources and
              citations. Perfect for current events, fact-checking, and research
              queries.
            </div>

            <p className="text-gray-500 mb-2">
              <strong>
                Check out{' '}
                <a
                  href="https://www.lovguiden.dk/"
                  target="_blank"
                  rel="noopener"
                  className="text-lg text-blue-600"
                >
                  Lovguiden
                </a>
                , a Danish legal AI platform, for a real-world example of AI in
                action.
              </strong>
            </p>

            {/* Mode selection */}
            <div className="flex gap-2 mt-4 justify-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-20 h-20 rounded-xl ${
                        selectedMode === 'default'
                          ? 'border-2 border-blue-600'
                          : 'border border-gray-300'
                      } hover:bg-blue-50/50`}
                      onClick={() => setSelectedMode('default')}
                    >
                      <MessageSquare
                        className={`w-10 h-10 ${
                          selectedMode === 'default'
                            ? 'text-blue-600'
                            : 'text-gray-600'
                        }`}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Regular Chat Mode</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-20 h-20 rounded-xl ${
                        selectedMode === 'pdf'
                          ? 'border-2 border-blue-600'
                          : 'border border-gray-300'
                      } hover:bg-blue-50/50`}
                      onClick={() => setSelectedMode('pdf')}
                    >
                      <FileText
                        className={`w-10 h-10 ${
                          selectedMode === 'pdf'
                            ? 'text-blue-600'
                            : 'text-gray-600'
                        }`}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>PDF Chat Mode</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-20 h-20 rounded-xl ${
                        selectedMode === 'search'
                          ? 'border-2 border-blue-600'
                          : 'border border-gray-300'
                      } hover:bg-blue-50/50`}
                      onClick={() => setSelectedMode('search')}
                    >
                      <Search
                        className={`w-10 h-10 ${
                          selectedMode === 'search'
                            ? 'text-blue-600'
                            : 'text-gray-600'
                        }`}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Web Search Mode (Powered by Tavily AI)
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <p className="text-sm text-gray-500 mt-2">
              Select your preferred chat mode
            </p>
          </div>
        ) : (
          // Messages display
          <div className="flex-1 overflow-auto w-full px-1 md:px-2 py-1">
            {messages.map((message) => (
              <div
                key={message.id}
                className="w-full max-w-[700px] mx-auto p-0 md:p-[2px] lg:p-[1px] xl:p-[1px]"
              >
                {message.display}
              </div>
            ))}
            <ChatScrollAnchor trackVisibility />
          </div>
        )}

        {/* Rate limit info */}
        {rateLimitInfo &&
          !rateLimitInfo.success &&
          rateLimitInfo.reset &&
          userInfo && (
            <div className="bg-black/10 rounded-lg max-w-[800px] p-1 md:p-2 lg:p-4 xl:p-4 my-1 text-center mx-auto">
              <p className="mb-1">{rateLimitInfo.message}</p>
              <p className="text-sm mb-1">
                Please wait until{' '}
                {new Date(rateLimitInfo.reset * 1000).toLocaleTimeString()} to
                send more messages.
              </p>
              <Button
                asChild
                className="rounded-lg transform transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <Link href="#">Buy more credits</Link>
              </Button>
            </div>
          )}

        {/* Input area */}
        <form
          onSubmit={handleSubmit}
          className="items-center max-w-[700px] mx-auto w-full mt-auto pb-2 px-1 md:px-3 gap-1 flex flex-row sticky"
        >
          <div className="relative w-full">
            <Textarea
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loadingState === 'searching'}
              placeholder="Type a message..."
              className="w-full rounded-2xl bg-white resize-none py-2 pr-10 pl-2 min-h-[40px]"
            />

            <div className="absolute right-2 bottom-1.5">
              {loadingState === 'searching' ? (
                <Button
                  onClick={stop}
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10 rounded-full p-0 group"
                >
                  <span className="group-hover:hidden">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </span>
                  <span className="hidden group-hover:inline">
                    <StopCircle className="h-5 w-5" />
                  </span>
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="h-4 w-10 rounded-full p-0"
                >
                  <Send className="h-10 w-10" />
                </Button>
              )}
            </div>
          </div>

          {/* Mode switcher for active chat */}
          {messages.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="p-1 h-fit border border-gray-200 rounded-lg hover:bg-gray-100"
                      >
                        {selectedMode === 'default' ? (
                          <MessageSquare className="w-6 h-6" />
                        ) : selectedMode === 'pdf' ? (
                          <FileText className="w-6 h-6" />
                        ) : (
                          <Search className="w-6 h-6" />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-auto" align="start">
                      <div className="flex flex-row w-fit">
                        {[
                          {
                            mode: 'default',
                            icon: <MessageSquare className="w-10 h-10" />,
                            title: 'Regular Chat'
                          },
                          {
                            mode: 'pdf',
                            icon: <FileText className="w-10 h-10" />,
                            title: 'PDF Chat'
                          },
                          {
                            mode: 'search',
                            icon: <Search className="w-10 h-10" />,
                            title: 'Web Search'
                          }
                        ].map((item, index) => (
                          <Button
                            key={item.mode}
                            variant="ghost"
                            className={`
                              flex-1 flex-col items-center gap-1 py-6 px-4 rounded-none h-auto
                              ${selectedMode === item.mode ? 'bg-gray-100' : ''}
                              ${index === 0 ? 'border-r border-gray-200' : ''}
                              ${index === 1 ? 'border-r border-gray-200' : ''}
                            `}
                            onClick={() => {
                              setSelectedMode(
                                item.mode as 'default' | 'pdf' | 'search'
                              );
                              setIsPopoverOpen(false);
                            }}
                          >
                            <div
                              className={
                                selectedMode === item.mode
                                  ? 'text-blue-600'
                                  : 'text-gray-500'
                              }
                            >
                              {item.icon}
                            </div>
                            <p
                              className={`text-sm text-center mt-1 ${
                                selectedMode === item.mode
                                  ? 'font-semibold'
                                  : ''
                              }`}
                            >
                              {item.title}
                            </p>
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </TooltipTrigger>
                <TooltipContent>Change mode</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </form>
      </div>
    </ErrorBoundary>
  );
}
