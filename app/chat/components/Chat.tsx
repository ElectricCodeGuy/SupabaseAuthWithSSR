'use client';

import React, { useState, useOptimistic, startTransition } from 'react';
import { useChat, type Message } from '@ai-sdk/react';
import { useParams } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { ChatScrollAnchor } from '../hooks/chat-scroll-anchor';
import { setModelSettings } from '../actions';
import Link from 'next/link';
import { useUpload } from '../context/uploadContext';
// Shadcn UI components
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import MemoizedMarkdown from './tools/MemoizedMarkdown';
import ReasoningContent from './tools/Reasoning';
import SourceView from './tools/SourceView';
import DocumentSearchTool from './tools/DocumentChatTool';
import WebsiteSearchTool from './tools/WebsiteChatTool';
import MessageInput from './ChatMessageInput';
import { toast } from 'sonner';

// Icons from Lucide React
import { User, Bot, Copy, CheckCircle, FileIcon } from 'lucide-react';

interface ChatProps {
  currentChat?: Message[];
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
    initialMessages: currentChat,
    onFinish: async () => {
      if (chatId === currentChatId) return;

      await mutate((key) => Array.isArray(key) && key[0] === 'chatPreviews');
    },

    onError: (error) => {
      toast.error(error.message || 'An error occurred'); // This could lead to sensitive information exposure. A general error message is safer.
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

            // Group parts by type for ordered rendering
            const textParts =
              message.parts?.filter((part) => part.type === 'text') || [];
            const reasoningParts =
              message.parts?.filter((part) => part.type === 'reasoning') || [];
            const sourceParts =
              message.parts?.filter((part) => part.type === 'source') || [];

            return (
              <li key={`${message.id}-${index}`} className="my-4 mx-2">
                <Card
                  className={`relative gap-2 py-4 ${
                    isUserMessage
                      ? 'bg-primary/5 dark:bg-primary/10 border-primary/20'
                      : 'bg-card dark:bg-card/90 border-border/50'
                  }`}
                >
                  <CardHeader className="pb-2 px-4">
                    <div className="flex items-center gap-3">
                      {isUserMessage ? (
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">
                          {isUserMessage ? 'You' : 'AI Assistant'}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {message.createdAt
                            ? new Date(message.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false
                                }
                              )
                            : new Date().toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })}
                        </p>
                      </div>
                      {!isUserMessage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopy(message.content)}
                        >
                          {isCopied ? (
                            <CheckCircle
                              size={14}
                              className="text-green-600 dark:text-green-400"
                            />
                          ) : (
                            <Copy size={14} />
                          )}
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 px-4">
                    {/* Render text parts first (main message content) */}
                    {textParts.map((part, partIndex) => (
                      <MemoizedMarkdown
                        key={`text-${partIndex}`}
                        content={part.text}
                        id={`${isUserMessage ? 'user' : 'assistant'}-text-${
                          message.id
                        }-${partIndex}`}
                      />
                    ))}

                    {/* Then render reasoning parts (only for assistant messages) */}
                    {!isUserMessage &&
                      reasoningParts.map((part, partIndex) => (
                        <div key={`reasoning-${partIndex}`} className="mt-4">
                          <ReasoningContent
                            details={part.details}
                            messageId={message.id}
                          />
                        </div>
                      ))}

                    {/* Then render source parts (only for assistant messages) */}
                    {!isUserMessage &&
                      sourceParts.map((part, partIndex) => (
                        <div key={`source-${partIndex}`} className="mt-2">
                          <SourceView source={part.source} />
                        </div>
                      ))}

                    {/* Display attached files in user messages */}
                    {isUserMessage &&
                      message.experimental_attachments &&
                      message.experimental_attachments.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-sm font-medium mb-2">
                            Attached Files:
                          </h4>
                          <div className="space-y-2">
                            {message.experimental_attachments.map(
                              (attachment, idx) => (
                                <div
                                  key={`attachment-${idx}`}
                                  className="flex items-center gap-2 p-2 bg-background rounded border"
                                >
                                  <FileIcon className="h-4 w-4 text-blue-500" />
                                  <Link
                                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline flex-1"
                                    href={`?file=${attachment.name}`}
                                  >
                                    {attachment.name}
                                  </Link>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Render all tool invocations in a single accordion */}
                    {hasToolInvocations && (
                      <div className="mt-6">
                        <Accordion
                          type="single"
                          defaultValue="tool-invocation"
                          collapsible
                          className="w-full border rounded-lg"
                        >
                          <AccordionItem
                            value="tool-invocation"
                            className="border-0"
                          >
                            <AccordionTrigger className="px-4 py-3 font-medium hover:no-underline">
                              <div className="flex items-center gap-2">
                                <Bot className="h-4 w-4" />
                                <span>AI Tools Used</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <div className="space-y-4">
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
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </li>
            );
          })}
          <ChatScrollAnchor trackVisibility status={status} />
        </ul>
      )}

      <div className="sticky bottom-0 mt-auto max-w-[720px] mx-auto w-full z-5 pb-2">
        {/*Separate message input component, to avoid re-rendering the chat messages when typing */}
        <MessageInput
          chatId={chatId}
          apiEndpoint={apiEndpoint}
          currentChat={messages}
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

export default ChatComponent;
