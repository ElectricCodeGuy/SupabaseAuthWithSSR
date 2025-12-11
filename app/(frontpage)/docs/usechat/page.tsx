'use client';

import { motion } from 'framer-motion';
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
    type: 'Message[]',
    description: 'Array of chat messages with role, content, and id'
  },
  {
    name: 'input',
    type: 'string',
    description: 'Current value of the input field'
  },
  {
    name: 'handleInputChange',
    type: 'function',
    description: 'Handler for input change events'
  },
  {
    name: 'handleSubmit',
    type: 'function',
    description: 'Form submission handler to send messages'
  },
  {
    name: 'isLoading',
    type: 'boolean',
    description: 'Whether a request is currently in progress'
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
  }
];

export default function UseChatPage() {
  return (
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
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
              interfaces. It handles streaming, state management, and UI updates
              so you can focus on creating great user experiences.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-16"
          >
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
          </motion.div>

          {/* Basic Usage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold mb-6">Basic Usage</h2>
            <Card className="bg-zinc-950 border-zinc-800 overflow-hidden mb-6">
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
                  <code className="text-zinc-100">
                    {`'use client';

import { useChat } from '@ai-sdk/react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div className="flex flex-col h-screen">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={\`p-4 rounded-lg \${
              message.role === 'user'
                ? 'bg-blue-500 text-white ml-auto'
                : 'bg-gray-100'
            }\`}
          >
            {message.content}
          </div>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
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
          </motion.div>

          {/* Return Values */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold mb-6">Return Values</h2>
            <p className="text-muted-foreground mb-6">
              The useChat hook returns an object with the following properties:
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
          </motion.div>

          {/* Configuration Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold mb-6">Configuration Options</h2>
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
                  <code className="text-zinc-100">
                    {`const { messages, input, handleSubmit } = useChat({
  // Custom API endpoint (default: '/api/chat')
  api: '/api/custom-chat',

  // Unique ID for this chat instance
  id: 'my-chat',

  // Initial messages to populate the chat
  initialMessages: [
    { id: '1', role: 'assistant', content: 'Hello! How can I help?' }
  ],

  // Initial input value
  initialInput: '',

  // Callback when response finishes
  onFinish: (message) => {
    console.log('AI responded:', message);
  },

  // Callback on errors
  onError: (error) => {
    console.error('Chat error:', error);
  },

  // Custom headers for API requests
  headers: {
    'Authorization': 'Bearer token'
  },

  // Additional body parameters
  body: {
    model: 'gpt-4o',
    temperature: 0.7
  }
});`}
                  </code>
                </pre>
              </CardContent>
            </Card>
          </motion.div>

          {/* Server-side Setup */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold mb-6">Server-side API Route</h2>
            <p className="text-muted-foreground mb-4">
              The useChat hook expects an API endpoint that streams responses.
              Here&apos;s how to set it up:
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
                  <code className="text-zinc-100">
                    {`import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    system: 'You are a helpful assistant.',
    messages,
  });

  return result.toDataStreamResponse();
}`}
                  </code>
                </pre>
              </CardContent>
            </Card>
          </motion.div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
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
          </motion.div>
        </div>
      </section>
    </div>
  );
}
