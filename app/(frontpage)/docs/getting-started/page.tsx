'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Rocket,
  Package,
  FileCode,
  Terminal,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

const steps = [
  {
    number: 1,
    title: 'Install the AI SDK',
    description: 'Add the core AI SDK and your preferred provider package.',
    icon: Package
  },
  {
    number: 2,
    title: 'Set up environment variables',
    description: 'Configure your API keys securely.',
    icon: Terminal
  },
  {
    number: 3,
    title: 'Create an API route',
    description: 'Set up a streaming endpoint for chat.',
    icon: FileCode
  },
  {
    number: 4,
    title: 'Build your UI',
    description: 'Use the useChat hook to create your interface.',
    icon: CheckCircle2
  }
];

const providers = [
  { name: 'OpenAI', package: '@ai-sdk/openai', envVar: 'OPENAI_API_KEY' },
  {
    name: 'Anthropic',
    package: '@ai-sdk/anthropic',
    envVar: 'ANTHROPIC_API_KEY'
  },
  { name: 'Google', package: '@ai-sdk/google', envVar: 'GOOGLE_API_KEY' },
  { name: 'Mistral', package: '@ai-sdk/mistral', envVar: 'MISTRAL_API_KEY' }
];

export default function GettingStartedPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/10" />
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
              <Rocket className="w-3 h-3 text-green-500" />
              <span className="text-sm font-medium text-green-500">
                Quick Start
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Getting Started
            </h1>
            <p className="text-xl text-muted-foreground">
              Get up and running with the AI SDK in your Next.js application in
              just a few minutes. Follow these steps to build your first AI chat
              interface.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Steps Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-12"
          >
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <Card
                    key={step.number}
                    className="bg-background/50 backdrop-blur-sm text-center"
                  >
                    <CardContent className="p-4">
                      <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                        <Icon className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Step {step.number}
                      </div>
                      <div className="font-semibold text-sm">{step.title}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>

          {/* Step 1: Installation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">
                1
              </span>
              Install the AI SDK
            </h2>
            <p className="text-muted-foreground mb-4">
              Install the core AI SDK package along with your preferred provider
              package:
            </p>
            <Card className="bg-zinc-950 border-zinc-800 overflow-hidden mb-6">
              <CardContent className="p-0">
                <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
                  <Terminal className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm text-zinc-400">Terminal</span>
                </div>
                <pre className="p-4 overflow-x-auto text-sm">
                  <code className="text-zinc-100">
                    {`# Install the core SDK and React hooks
npm install ai @ai-sdk/react

# Install your preferred provider(s)
npm install @ai-sdk/openai      # For OpenAI (GPT-4, etc.)
npm install @ai-sdk/anthropic   # For Anthropic (Claude)
npm install @ai-sdk/google      # For Google (Gemini)`}
                  </code>
                </pre>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {providers.map((provider) => (
                <div
                  key={provider.name}
                  className="p-3 rounded-lg bg-muted/50 border border-border text-center"
                >
                  <div className="font-semibold text-sm">{provider.name}</div>
                  <code className="text-xs text-muted-foreground">
                    {provider.package}
                  </code>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Step 2: Environment Variables */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">
                2
              </span>
              Set Up Environment Variables
            </h2>
            <p className="text-muted-foreground mb-4">
              Create a <code className="text-primary">.env.local</code> file in
              your project root and add your API keys:
            </p>
            <Card className="bg-zinc-950 border-zinc-800 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
                  <FileCode className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm text-zinc-400">.env.local</span>
                </div>
                <pre className="p-4 overflow-x-auto text-sm">
                  <code className="text-zinc-100">
                    {`# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google
GOOGLE_GENERATIVE_AI_API_KEY=...`}
                  </code>
                </pre>
              </CardContent>
            </Card>
          </motion.div>

          {/* Step 3: API Route */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">
                3
              </span>
              Create an API Route
            </h2>
            <p className="text-muted-foreground mb-4">
              Create a new API route to handle chat requests:
            </p>
            <Card className="bg-zinc-950 border-zinc-800 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
                  <FileCode className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm text-zinc-400">
                    app/api/chat/route.ts
                  </span>
                </div>
                <pre className="p-4 overflow-x-auto text-sm">
                  <code className="text-zinc-100">
                    {`import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

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

          {/* Step 4: Build UI */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">
                4
              </span>
              Build Your Chat Interface
            </h2>
            <p className="text-muted-foreground mb-4">
              Create a chat component using the useChat hook:
            </p>
            <Card className="bg-zinc-950 border-zinc-800 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
                  <FileCode className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm text-zinc-400">app/page.tsx</span>
                </div>
                <pre className="p-4 overflow-x-auto text-sm">
                  <code className="text-zinc-100">
                    {`'use client';

import { useChat } from '@ai-sdk/react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div className="flex flex-col w-full max-w-md mx-auto py-24 stretch">
      <div className="space-y-4">
        {messages.map((m) => (
          <div key={m.id} className="whitespace-pre-wrap">
            <span className="font-bold">
              {m.role === 'user' ? 'You: ' : 'AI: '}
            </span>
            {m.content}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="fixed bottom-0 w-full max-w-md p-2">
        <input
          className="w-full p-2 border border-gray-300 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
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

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-16"
          >
            <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">
                      You&apos;re All Set!
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Run <code className="text-primary">npm run dev</code> and
                      visit <code className="text-primary">localhost:3000</code>{' '}
                      to see your AI chat in action.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button asChild size="sm">
                        <Link href="/chat">
                          Try Our AI Chat
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <a
                          href="https://ai-sdk.dev/docs"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Official Docs
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex justify-between items-center pt-8 border-t border-border"
          >
            <Button asChild variant="ghost">
              <Link href="/docs/core-functions">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Core Functions
              </Link>
            </Button>
            <Button asChild>
              <Link href="/docs">Back to Docs Home</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
