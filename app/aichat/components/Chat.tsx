'use client';

import type { KeyboardEvent } from 'react';
import React, { useState, useOptimistic, startTransition, useRef } from 'react';
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
import { toast } from 'sonner';
// Shadcn UI components
import { Button } from '@/components/ui/button';
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
  Loader2,
  ChevronDown,
  User,
  Bot,
  Copy,
  CheckCircle,
  Paperclip,
  Square,
  X,
  FileIcon
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
  const { messages, status } = useChat({
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
    <div className="flex h-[calc(100vh-48px)] w-full flex-col overflow-y-auto">
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
        <ul className="flex-1 w-full mx-auto max-w-[1000px] px-0 md:px-1 lg:px-4">
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
                            id={`${isUserMessage ? 'user' : 'assistant'}-text-${
                              message.id
                            }-${partIndex}`}
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

                  {/* Display attached files in user messages */}
                  {isUserMessage &&
                    message.experimental_attachments &&
                    message.experimental_attachments.length > 0 && (
                      <div className="border-t pt-2 mt-2">
                        {message.experimental_attachments.map(
                          (attachment, idx) => (
                            <div
                              key={`attachment-${idx}`}
                              className="flex items-center gap-2 text-sm"
                            >
                              <FileIcon className="h-4 w-4 text-blue-500" />
                              <span className="font-medium text-blue-600 dark:text-blue-400">
                                {attachment.name}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}

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
          <ChatScrollAnchor trackVisibility status={status} />
        </ul>
      )}

      <div className="sticky bottom-0 mt-auto max-w-[720px] mx-auto w-full z-5 pb-2">
        <MessageInput
          chatId={chatId}
          apiEndpoint={apiEndpoint}
          option={optimisticOption}
          currentChatId={currentChatId}
          modelType={optimisticModelType}
          selectedOption={optimisticOption}
          handleModelTypeChange={handleModelTypeChange}
          handleOptionChange={handleOptionChange}
          modelTypes={modelTypes}
        />
      </div>
    </div>
  );
};

// Separate message input component, to avoid re-rendering the chat messages when typing
const MessageInput = ({
  chatId,
  apiEndpoint,
  option,
  currentChatId,
  modelType,
  selectedOption,
  handleModelTypeChange,
  handleOptionChange,
  modelTypes
}: {
  chatId: string;
  apiEndpoint: string;
  option: string;
  currentChatId: string;
  modelType: string;
  selectedOption: string;
  handleModelTypeChange: (value: string) => void;
  handleOptionChange: (value: string) => void;
  modelTypes: { value: string; label: string }[];
}) => {
  const { selectedBlobs } = useUpload();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { mutate } = useSWRConfig();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const { input, handleInputChange, handleSubmit, status, stop } = useChat({
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
      handleFormSubmit(event);
    }
  };

  // Create FileList from files
  function createFileList(files: File[]): FileList {
    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));
    return dataTransfer.files;
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf')) {
      toast.error('Only PDF files are allowed');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      // This file limit is here due to Vercel serverless function impose a 4.5 MB limit
      toast.error('File is too large (max 3MB)');
      return;
    }

    setAttachedFile(file);
  };

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !attachedFile) return;

    // Handle the submission with experimental attachments
    if (attachedFile) {
      handleSubmit(e, {
        experimental_attachments: createFileList([attachedFile])
      });

      setAttachedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      handleSubmit(e);
    }
  };

  return (
    <>
      <form
        onSubmit={handleFormSubmit}
        className="relative max-w-[720px] mx-auto mb-1 backdrop-blur-sm rounded-2xl overflow-hidden border-1 shadow-sm flex flex-col transition-all duration-200 shadow-md dark:shadow-lg focus-within:shadow-lg dark:focus-within:shadow-xl hover:border-gray-300 dark:hover:border-gray-700 focus-within:border-gray-300 dark:focus-within:border-gray-700 cursor-text"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,application/pdf"
          className="hidden"
        />

        <Textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={status !== 'ready'}
          className="w-full pt-3 pb-1.5 min-h-0 max-h-40 resize-none border-0 shadow-none focus:ring-0 focus-visible:ring-0 focus:outline-none bg-transparent focus:bg-transparent dark:bg-transparent dark:focus:bg-transparent"
          rows={1}
        />

        {/* Bottom controls row with buttons */}
        <div className="flex px-2.5 pb-1 pt-1.5 items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            {!attachedFile && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 cursor-pointer text-xs rounded-md flex items-center gap-1.5 hover:bg-primary/5 dark:hover:bg-primary/10"
                disabled={status !== 'ready'}
              >
                <Paperclip className="h-3.5 w-3.5" />
                <span>Attach file</span>
              </Button>
            )}

            <div className="flex-1 max-w-[160px]">
              <Select value={modelType} onValueChange={handleModelTypeChange}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {modelTypes.map((model) => (
                    <SelectItem
                      key={model.value}
                      value={model.value}
                      className="text-xs"
                    >
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {modelType === 'standart' && (
              <div className="flex-1 ml-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 justify-between text-xs"
                    >
                      <span className="truncate">{selectedOption}</span>
                      <ChevronDown className="h-3 w-3 ml-2 flex-shrink-0 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
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
                        className={`text-xs ${
                          selectedOption === option
                            ? 'bg-primary/20 dark:bg-primary/30 text-primary dark:text-primary-foreground'
                            : ''
                        }`}
                      >
                        {option}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {attachedFile && (
              <div className="bg-primary/5 dark:bg-primary/10 p-1 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <FileIcon className="h-4 w-4 text-primary mr-2" />
                  <span className="text-sm font-medium dark:text-white">
                    {attachedFile.name}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({Math.round(attachedFile.size / 1024)} KB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAttachedFile(null)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {selectedBlobs.length > 0 && (
              <div className="hidden sm:flex items-center rounded-full text-xs px-2 h-8 bg-primary/10 border border-primary/30">
                <Paperclip className="mr-1 h-4 w-4 text-primary" />
                <span className="text-primary font-medium">
                  {selectedBlobs.length} file
                  {selectedBlobs.length > 1 ? 's' : ''} attached
                </span>
              </div>
            )}
          </div>

          {/* Send button or spinner with matched sizing */}
          {status !== 'ready' ? (
            <div
              className="h-8 w-8 sm:h-10 sm:w-10 mr-2 flex items-center justify-center border border-primary/30 cursor-pointer relative group rounded-lg bg-background"
              onClick={stop}
            >
              {/* Loading indicator (visible by default, hidden on hover) */}
              <div className="flex items-center justify-center transition-opacity group-hover:opacity-0">
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary animate-spin" />
              </div>

              {/* Stop button (hidden by default, visible on hover) */}
              <div className="absolute inset-0 hidden group-hover:flex items-center justify-center">
                <Square size={14} className="text-red-500 sm:h-4 sm:w-4" />
              </div>
            </div>
          ) : (
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              disabled={!input.trim() && !attachedFile}
              className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors border border-primary/30 rounded-lg cursor-pointer"
            >
              <Send className="text-primary w-5 h-5 sm:w-8 sm:h-8" />
            </Button>
          )}
        </div>
      </form>
    </>
  );
};

export default ChatComponent;
