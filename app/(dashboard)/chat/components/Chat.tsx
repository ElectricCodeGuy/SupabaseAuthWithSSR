'use client';

import React, { useState, useOptimistic, startTransition } from 'react';
import { useChat, type UIMessage } from '@ai-sdk/react';
import { useParams } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { ChatScrollAnchor } from '../hooks/chat-scroll-anchor';
import { setModelSettings } from '../actions';
import Link from 'next/link';
// Shadcn UI components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import MemoizedMarkdown from './tools/MemoizedMarkdown';
import ReasoningContent from './tools/Reasoning';
import SourceView from './tools/SourceView';
import DocumentSearchTool from './tools/DocumentChatTool';
import { WebsiteSearchTool } from './tools/WebsiteSearchTool';
import MessageInput from './ChatMessageInput';
import { toast } from 'sonner';
// Icons from Lucide React
import { User, Bot, Copy, CheckCircle, FileIcon } from 'lucide-react';
import { type ToolUIPart, DefaultChatTransport } from 'ai';
import type { UITools } from '@/app/(dashboard)/chat/types/tooltypes';
import { useRouter } from 'next/navigation';

interface ChatProps {
  currentChat?: UIMessage[];
  chatId: string;
  initialSelectedOption: string;
}

const ChatComponent: React.FC<ChatProps> = ({
  currentChat,
  chatId,
  initialSelectedOption
}) => {
  const param = useParams();
  const router = useRouter();
  const currentChatId = param.id as string;
  const { mutate } = useSWRConfig();

  const [isCopied, setIsCopied] = useState(false);
  const [optimisticOption, setOptimisticOption] = useOptimistic<string, string>(
    initialSelectedOption,
    (_, newValue) => newValue
  );

  const handleOptionChange = async (newValue: string) => {
    startTransition(async () => {
      setOptimisticOption(newValue);
      await setModelSettings(newValue);
    });
  };

  const { messages, status, sendMessage, stop } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat'
    }),
    experimental_throttle: 50,
    messages: currentChat,
    onFinish: async () => {
      // Navigate to the new chat URL if we're not already there
      if (chatId !== currentChatId) {
        const currentSearchParams = new URLSearchParams(window.location.search);
        let newUrl = `/chat/${chatId}`;

        if (currentSearchParams.toString()) {
          newUrl += `?${currentSearchParams.toString()}`;
        }

        router.push(newUrl, { scroll: false });
      }

      // Always mutate to refresh the chat list
      await mutate((key) => Array.isArray(key) && key[0] === 'chatPreviews');
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || 'An error occurred');
    }
  });

  // Helper function to get text content from message parts
  const getMessageContent = (message: UIMessage) => {
    return (
      message.parts
        ?.filter((part) => part.type === 'text')
        ?.map((part) => part.text)
        ?.join('') || ''
    );
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-y-auto">
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

            // Get created at time
            const createdAtTime = message.id
              ? new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })
              : new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                });

            return (
              <li key={`${message.id}-${index}`} className="my-4 mx-2">
                <Card
                  className={`relative gap-2 py-2 ${
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
                          {createdAtTime}
                        </p>
                      </div>
                      {!isUserMessage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopy(getMessageContent(message))}
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

                  <CardContent className="py-0 px-4">
                    {(() => {
                      // Collect all sources for this message
                      const sources = message.parts?.filter(
                        (part) =>
                          (part.type === 'source-url' ||
                            part.type === 'source-document') &&
                          !isUserMessage
                      ) as Extract<
                        (typeof message.parts)[number],
                        { type: 'source-url' | 'source-document' }
                      >[];

                      return (
                        <>
                          {/* Render ALL parts in the order they appear */}
                          {message.parts?.map((part, partIndex) => {
                            const indexStr = `${message.id}-${partIndex}`;

                            // Handle text parts
                            if (part.type === 'text') {
                              return (
                                <MemoizedMarkdown
                                  key={`part-${partIndex}`}
                                  content={part.text}
                                  id={`${
                                    isUserMessage ? 'user' : 'assistant'
                                  }-text-${message.id}-${partIndex}`}
                                />
                              );
                            }

                            // Handle reasoning parts (assistant only)
                            if (part.type === 'reasoning' && !isUserMessage) {
                              return (
                                <div key={`part-${partIndex}`} className="mt-4">
                                  <ReasoningContent
                                    details={part}
                                    messageId={message.id}
                                  />
                                </div>
                              );
                            }

                            // Skip source parts - they'll be rendered together below
                            if (
                              (part.type === 'source-url' ||
                                part.type === 'source-document') &&
                              !isUserMessage
                            ) {
                              return null;
                            }

                            // Handle file parts (user messages)
                            if (part.type === 'file' && isUserMessage) {
                              return (
                                <div key={`part-${partIndex}`} className="mt-4">
                                  <div className="flex items-center gap-2 p-2 bg-background rounded border">
                                    <FileIcon className="h-4 w-4 text-blue-500" />
                                    <Link
                                      className="font-medium text-blue-600 dark:text-blue-400 hover:underline flex-1"
                                      href={`?file=${part.filename || 'file'}`}
                                    >
                                      {part.filename || 'Attached File'}
                                    </Link>
                                  </div>
                                </div>
                              );
                            }

                            // Handle tool invocation parts (assistant only)
                            if (
                              part.type === 'tool-searchUserDocument' &&
                              !isUserMessage
                            ) {
                              return (
                                <DocumentSearchTool
                                  key={`part-${partIndex}`}
                                  toolInvocation={
                                    part as Extract<
                                      ToolUIPart<UITools>,
                                      {
                                        type: 'tool-searchUserDocument';
                                      }
                                    >
                                  }
                                  index={indexStr}
                                />
                              );
                            }
                            if (
                              part.type === 'tool-websiteSearchTool' &&
                              !isUserMessage
                            ) {
                              return (
                                <WebsiteSearchTool
                                  key={`part-${partIndex}`}
                                  toolInvocation={
                                    part as Extract<
                                      ToolUIPart<UITools>,
                                      {
                                        type: 'tool-websiteSearchTool';
                                      }
                                    >
                                  }
                                  index={indexStr}
                                />
                              );
                            }

                            return null;
                          })}

                          {/* Render all sources together in a single dropdown */}
                          {sources && sources.length > 0 && (
                            <div className="mt-2">
                              <SourceView sources={sources} />
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              </li>
            );
          })}
          <ChatScrollAnchor trackVisibility status={status} />
        </ul>
      )}

      <div className="sticky bottom-0 mt-auto max-w-[720px] mx-auto w-full z-5 pb-2">
        {/* Pass chat functions as props to MessageInput */}
        <MessageInput
          chatId={chatId}
          selectedOption={optimisticOption}
          handleOptionChange={handleOptionChange}
          sendMessage={sendMessage}
          status={status}
          stop={stop}
        />
      </div>
    </div>
  );
};

export default ChatComponent;
