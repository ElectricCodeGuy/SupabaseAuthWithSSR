import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  Zap,
  RefreshCw,
  AlertCircle,
  Settings
} from 'lucide-react';
import {
  DocsPageWrapper,
  AnimatedSection
} from '../components/DocsPageWrapper';

const hookFeatures = [
  {
    icon: Zap,
    title: 'Real-time Streaming',
    description:
      'Messages stream in real-time as the AI generates responses, providing immediate feedback to users.'
  },
  {
    icon: RefreshCw,
    title: 'Automatic State Management',
    description:
      'Handles message history, loading states, and input management automatically.'
  },
  {
    icon: AlertCircle,
    title: 'Built-in Error Handling',
    description:
      'Gracefully handles errors with built-in error state and retry capabilities.'
  },
  {
    icon: Settings,
    title: 'Highly Configurable',
    description:
      'Customize API endpoints, headers, request body, and more to fit your needs.'
  }
];

const returnValues = [
  {
    name: 'messages',
    type: 'UIMessage[]',
    description: 'Array of chat messages with role, parts array, and id'
  },
  {
    name: 'status',
    type: 'string',
    description: "Chat status: 'ready', 'submitted', 'streaming', or 'error'"
  },
  {
    name: 'sendMessage',
    type: 'function',
    description: 'Send a new message with parts (text, files, etc.)'
  },
  {
    name: 'input',
    type: 'string',
    description: 'Current value of the input field (optional helper)'
  },
  {
    name: 'error',
    type: 'Error | undefined',
    description: 'Error object if the last request failed'
  },
  {
    name: 'reload',
    type: 'function',
    description: 'Regenerate the last AI response'
  },
  {
    name: 'stop',
    type: 'function',
    description: 'Abort the current streaming response'
  },
  {
    name: 'setMessages',
    type: 'function',
    description: 'Manually set the messages array'
  },
  {
    name: 'onData',
    type: 'callback',
    description: 'Handler for transient data parts from the server'
  }
];

export default function UseChatPage() {
  return (
    <DocsPageWrapper>
      <div className="min-h-screen">
        {/* Header */}
        <section className="relative py-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <Link
              href="/docs"
              className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Documentation
            </Link>

            <AnimatedSection>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
                <MessageSquare className="w-3 h-3 text-purple-500" />
                <span className="text-sm font-medium text-purple-500">
                  AI SDK UI
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                useChat Hook
              </h1>
              <p className="text-xl text-muted-foreground">
                The useChat hook is your go-to solution for building chat
                interfaces. It handles streaming, state management, and UI
                updates so you can focus on creating great user experiences.
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Features */}
            <AnimatedSection delay={0.1} className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Key Features</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {hookFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <Card
                      key={index}
                      className="bg-background/50 backdrop-blur-sm"
                    >
                      <CardContent className="p-6">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                          <Icon className="w-5 h-5 text-purple-500" />
                        </div>
                        <h3 className="font-bold mb-2">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </AnimatedSection>

            {/* Basic Usage - v5 Pattern */}
            <AnimatedSection delay={0.2} className="mb-16">
              <h2 className="text-3xl font-bold mb-6">
                Basic Usage (AI SDK v5)
              </h2>
              <p className="text-muted-foreground mb-4">
                In v5, messages use a{' '}
                <code className="text-primary">parts</code> array instead of a
                single content string. Each part has a type (text, tool, file,
                etc.).
              </p>
              <Card className="bg-zinc-950 border-zinc-800 overflow-hidden mb-4">
                <CardContent className="p-0">
                  <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="ml-2 text-sm text-zinc-400">
                      components/Chat.tsx
                    </span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-sm">
                    <code className="language-typescript">
                      {`'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function Chat() {
  const { messages, status, sendMessage } = useChat();
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Send message with parts array
    sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: input }]
    });
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            <strong>{message.role}: </strong>
            {message.parts.map((part, index) => {
              switch (part.type) {
                case 'text':
                  return <span key={index}>{part.text}</span>;
                case 'tool-searchUserDocument':
                  return <DocumentToolResult key={index} part={part} />;
                default:
                  return null;
              }
            })}
          </div>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={status !== 'ready'}
          className="w-full p-2 border rounded"
        />
      </form>
    </div>
  );
}`}
                    </code>
                  </pre>
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* Return Values */}
            <AnimatedSection delay={0.3} className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Return Values</h2>
              <p className="text-muted-foreground mb-6">
                The useChat hook returns an object with the following
                properties:
              </p>
              <div className="space-y-3">
                {returnValues.map((value, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-muted/50 border border-border"
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <code className="text-sm font-mono font-bold text-primary">
                        {value.name}
                      </code>
                      <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                        {value.type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {value.description}
                    </p>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            {/* Configuration Options - v5 with Custom Transport */}
            <AnimatedSection delay={0.4} className="mb-16">
              <h2 className="text-3xl font-bold mb-6">
                Configuration with Custom Transport
              </h2>
              <p className="text-muted-foreground mb-4">
                In v5, you can customize how messages are sent using the{' '}
                <code className="text-primary">transport</code> option. This
                allows you to modify the request body, add custom headers, and
                more.
              </p>
              <Card className="bg-zinc-950 border-zinc-800 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="ml-2 text-sm text-zinc-400">
                      Configuration Example
                    </span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-sm">
                    <code className="language-typescript">
                      {`import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

const { messages, sendMessage, status } = useChat({
  // Unique ID for this chat instance
  id: 'my-chat',

  // Initial messages to populate the chat
  messages: initialMessages,

  // Custom transport for request customization
  transport: new DefaultChatTransport({
    api: '/api/chat',
    // Customize the request body
    prepareSendMessagesRequest({ messages, id }) {
      return {
        body: {
          chatId: id,
          message: messages[messages.length - 1],
          option: selectedModel, // e.g., 'gpt-4o'
        }
      };
    },
  }),

  // Callback when response finishes
  onFinish: (message) => {
    console.log('AI responded:', message);
  },

  // Callback on errors
  onError: (error) => {
    console.error('Chat error:', error);
  },

  // Handle transient data (not persisted in messages)
  onData: (data) => {
    console.log('Received transient data:', data);
  }
});`}
                    </code>
                  </pre>
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* Server-side Setup with Tools */}
            <AnimatedSection delay={0.5} className="mb-16">
              <h2 className="text-3xl font-bold mb-6">
                Server-side API Route with Tools
              </h2>
              <p className="text-muted-foreground mb-4">
                Here&apos;s a complete example showing how to set up an API
                route with tools and the{' '}
                <code className="text-primary">onStepFinish</code> callback for
                incremental saving:
              </p>
              <Card className="bg-zinc-950 border-zinc-800 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="ml-2 text-sm text-zinc-400">
                      app/api/chat/route.ts
                    </span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-sm">
                    <code className="language-typescript">
                      {`import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages, chatId } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    system: 'You are a helpful assistant with access to tools.',
    messages,

    // Define tools the AI can use
    tools: {
      searchDocuments: tool({
        description: 'Search through user documents',
        parameters: z.object({
          query: z.string().describe('Search query')
        }),
        execute: async ({ query }) => {
          // Your search logic here
          return { results: ['Document 1', 'Document 2'] };
        }
      }),
      searchWeb: tool({
        description: 'Search the web for information',
        parameters: z.object({
          query: z.string().describe('Search query')
        }),
        execute: async ({ query }) => {
          // Your web search logic here
          return { results: ['Web result 1', 'Web result 2'] };
        }
      })
    },

    // Called after each step (text, tool call, etc.)
    onStepFinish: async ({ stepType, text, toolCalls, toolResults }) => {
      // Save each step to database incrementally
      await saveStepToDatabase(chatId, {
        stepType,
        text,
        toolCalls,
        toolResults
      });
    },

    // Maximum tool calling rounds
    maxSteps: 5
  });

  return result.toDataStreamResponse();
}`}
                    </code>
                  </pre>
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* Tool Parts in UI */}
            <AnimatedSection delay={0.55} className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Rendering Tool Parts</h2>
              <p className="text-muted-foreground mb-4">
                In v5, each tool creates a part type like{' '}
                <code className="text-primary">tool-TOOLNAME</code>. Here&apos;s
                how to render different part types:
              </p>
              <Card className="bg-zinc-950 border-zinc-800 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="ml-2 text-sm text-zinc-400">
                      components/MessagePart.tsx
                    </span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-sm">
                    <code className="language-typescript">
                      {`// Render different message parts based on type
function renderPart(part: UIMessagePart, index: number) {
  switch (part.type) {
    case 'text':
      return <p key={index}>{part.text}</p>;

    case 'reasoning':
      return (
        <div key={index} className="text-gray-500 italic">
          Thinking: {part.text}
        </div>
      );

    case 'tool-searchDocuments':
      return (
        <div key={index} className="border rounded p-2">
          <div>Status: {part.state}</div>
          <div>Query: {part.input?.query}</div>
          {part.state === 'output-available' && (
            <div>Results: {JSON.stringify(part.output)}</div>
          )}
        </div>
      );

    case 'tool-searchWeb':
      return (
        <div key={index} className="border rounded p-2">
          <div>Web Search: {part.input?.query}</div>
          {part.output?.results?.map((r, i) => (
            <a key={i} href={r.url}>{r.title}</a>
          ))}
        </div>
      );

    case 'file':
      return <img key={index} src={part.url} alt={part.filename} />;

    default:
      return null;
  }
}`}
                    </code>
                  </pre>
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* Navigation */}
            <AnimatedSection
              delay={0.6}
              className="flex justify-between items-center pt-8 border-t border-border"
            >
              <Button asChild variant="ghost">
                <Link href="/docs/overview">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Overview
                </Link>
              </Button>
              <Button asChild>
                <Link href="/docs/core-functions">
                  Core Functions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </AnimatedSection>
          </div>
        </section>
      </div>
    </DocsPageWrapper>
  );
}
