import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Zap,
  Box,
  Shield,
  Layers,
  Wrench,
  MessageSquare
} from 'lucide-react';
import {
  DocsPageWrapper,
  AnimatedSection
} from '../components/DocsPageWrapper';

const providers = [
  { name: 'OpenAI', models: 'GPT-4, GPT-4o, o1, o3' },
  { name: 'Anthropic', models: 'Claude 3.5, Claude 4' },
  { name: 'Google', models: 'Gemini 2.0, Gemini 2.5' },
  { name: 'Mistral', models: 'Mistral Large, Codestral' },
  { name: 'Groq', models: 'Llama, Mixtral' },
  { name: 'Amazon Bedrock', models: 'Various models' }
];

const coreFeatures = [
  {
    icon: Zap,
    title: 'Unified API',
    description:
      'One consistent interface for all AI providers. Switch models without changing your code.',
    gradient: 'from-yellow-500 to-orange-500'
  },
  {
    icon: Box,
    title: 'Streaming Support',
    description:
      'Built-in streaming for real-time responses. Show users content as it generates.',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Wrench,
    title: 'Tool Calling',
    description:
      'Let AI call functions and use external APIs. Build agents that can take actions.',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    icon: Shield,
    title: 'Type Safe',
    description:
      'Full TypeScript support with excellent IDE integration and autocompletion.',
    gradient: 'from-purple-500 to-pink-500'
  }
];

const messagePartTypes = [
  {
    type: 'text',
    description: 'Regular text content from the AI response'
  },
  {
    type: 'reasoning',
    description: "The AI's internal reasoning process (chain-of-thought)"
  },
  {
    type: 'tool-*',
    description: 'Tool invocations with input, output, and state'
  },
  {
    type: 'file',
    description: 'File attachments like images or documents'
  }
];

export default function OverviewPage() {
  return (
    <DocsPageWrapper>
      <div className="min-h-screen">
        {/* Header */}
        <section className="relative py-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <Link
              href="/docs"
              className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Documentation
            </Link>

            <AnimatedSection>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
                <Sparkles className="w-3 h-3 text-blue-500" />
                <span className="text-sm font-medium text-blue-500">
                  Overview
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                What is the AI SDK?
              </h1>
              <p className="text-xl text-muted-foreground">
                The AI SDK is a TypeScript toolkit designed to help developers
                build AI-powered applications. It provides a unified API that
                works across multiple AI providers, making it easy to integrate
                language models into your applications.
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Two Libraries Section */}
            <AnimatedSection delay={0.1} className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Two Core Libraries</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Layers className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">AI SDK Core</h3>
                    <p className="text-muted-foreground mb-4">
                      A unified API for generating text, structured objects, and
                      tool calls with LLMs.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        generateText & streamText
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        generateObject & streamObject
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Tool calling support
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                      <Box className="w-6 h-6 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">AI SDK UI</h3>
                    <p className="text-muted-foreground mb-4">
                      Framework-agnostic hooks for building chat and generative
                      interfaces.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        useChat hook
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        useCompletion hook
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        useObject hook
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </AnimatedSection>

            {/* Core Features */}
            <AnimatedSection delay={0.2} className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Why Use the AI SDK?</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {coreFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <Card
                      key={index}
                      className="bg-background/50 backdrop-blur-sm"
                    >
                      <CardContent className="p-6">
                        <div
                          className={`w-10 h-10 rounded-lg bg-gradient-to-r ${feature.gradient} p-2 mb-4`}
                        >
                          <Icon className="w-full h-full text-white" />
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

            {/* Supported Providers */}
            <AnimatedSection delay={0.3} className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Supported Providers</h2>
              <p className="text-muted-foreground mb-6">
                The AI SDK integrates with all major AI providers through a
                unified interface:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {providers.map((provider, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-muted/50 border border-border"
                  >
                    <div className="font-semibold">{provider.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {provider.models}
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            {/* Message Parts Architecture */}
            <AnimatedSection delay={0.35} className="mb-16">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-primary" />
                Message Parts Architecture
              </h2>
              <p className="text-muted-foreground mb-6">
                In AI SDK v5, messages use a{' '}
                <code className="text-primary">parts</code> array instead of a
                simple content string. This enables rich content types including
                text, reasoning, tool calls, and file attachments:
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {messagePartTypes.map((part, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-muted/50 border border-border"
                  >
                    <code className="text-primary font-mono text-sm">
                      {part.type}
                    </code>
                    <p className="text-sm text-muted-foreground mt-1">
                      {part.description}
                    </p>
                  </div>
                ))}
              </div>
              <Card className="bg-zinc-950 border-zinc-800 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="ml-2 text-sm text-zinc-400">
                      Message structure example
                    </span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-sm">
                    <code className="language-javascript">
                      {`// Each message contains a parts array
const message = {
  id: 'msg_123',
  role: 'assistant',
  parts: [
    { type: 'reasoning', reasoning: 'Let me search...' },
    { type: 'tool-searchUserDocument',
      state: 'output-available',
      input: { query: 'TypeScript patterns' },
      output: { context: [...] }
    },
    { type: 'text', text: 'Based on your documents...' }
  ]
};`}
                    </code>
                  </pre>
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* Code Example */}
            <AnimatedSection delay={0.4} className="mb-16">
              <h2 className="text-3xl font-bold mb-6">
                Quick Example with Tools
              </h2>
              <p className="text-muted-foreground mb-4">
                Here&apos;s a complete example showing tool calling with the AI
                SDK:
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
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    messages,
    tools: {
      searchDocuments: tool({
        description: 'Search through documents',
        inputSchema: z.object({
          query: z.string().describe('Search query')
        }),
        execute: async ({ query }) => {
          // Your search logic here
          return { results: [...] };
        }
      })
    },
    maxSteps: 5, // Allow multi-step tool calls
  });

  return result.toDataStreamResponse();
}`}
                    </code>
                  </pre>
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* Navigation */}
            <AnimatedSection
              delay={0.5}
              className="flex justify-between items-center pt-8 border-t border-border"
            >
              <Button asChild variant="ghost">
                <Link href="/docs">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Documentation
                </Link>
              </Button>
              <Button asChild>
                <Link href="/docs/usechat">
                  useChat Hook
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
