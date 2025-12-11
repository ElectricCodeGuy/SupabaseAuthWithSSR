import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Cpu, FileText, Box } from 'lucide-react';
import {
  DocsPageWrapper,
  AnimatedSection
} from '../components/DocsPageWrapper';

const coreFunctions = [
  {
    name: 'generateText',
    icon: FileText,
    description:
      'Generate text for a given prompt. Best for non-interactive use cases like automation, email drafting, or summarization.',
    useCase: 'Non-streaming, complete responses',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    name: 'streamText',
    icon: Cpu,
    description:
      'Stream text responses in real-time. Perfect for chatbots and interactive applications where users see content as it generates.',
    useCase: 'Real-time streaming responses',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    name: 'generateObject',
    icon: Box,
    description:
      'Generate typed, structured objects that match a Zod schema. Ideal for data extraction, classification, and synthetic data generation.',
    useCase: 'Structured data output',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    name: 'streamObject',
    icon: Box,
    description:
      'Stream structured objects progressively. Useful for generating UI components or large structured responses incrementally.',
    useCase: 'Progressive structured output',
    gradient: 'from-green-500 to-emerald-500'
  }
];

export default function CoreFunctionsPage() {
  return (
    <DocsPageWrapper>
      <div className="min-h-screen">
        {/* Header */}
        <section className="relative py-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-red-500/10" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <Link
              href="/docs"
              className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Documentation
            </Link>

            <AnimatedSection>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 mb-4">
                <Cpu className="w-3 h-3 text-orange-500" />
                <span className="text-sm font-medium text-orange-500">
                  AI SDK Core
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Core Functions
              </h1>
              <p className="text-xl text-muted-foreground">
                The AI SDK Core provides powerful functions for text generation,
                structured output, and tool calling. These functions work with
                any supported model provider.
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Function Overview */}
            <AnimatedSection delay={0.1} className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Available Functions</h2>
              <div className="space-y-4">
                {coreFunctions.map((func, index) => {
                  const Icon = func.icon;
                  return (
                    <Card
                      key={index}
                      className="bg-background/50 backdrop-blur-sm"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-12 h-12 rounded-lg bg-gradient-to-r ${func.gradient} p-2.5 flex-shrink-0`}
                          >
                            <Icon className="w-full h-full text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <code className="text-lg font-mono font-bold">
                                {func.name}
                              </code>
                              <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                {func.useCase}
                              </span>
                            </div>
                            <p className="text-muted-foreground">
                              {func.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </AnimatedSection>

            {/* generateText Example */}
            <AnimatedSection delay={0.2} className="mb-16">
              <h2 className="text-3xl font-bold mb-4">generateText</h2>
              <p className="text-muted-foreground mb-6">
                Use generateText when you need a complete response before
                proceeding. It waits for the full response before returning.
              </p>
              <Card className="bg-zinc-950 border-zinc-800 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="ml-2 text-sm text-zinc-400">
                      generateText Example
                    </span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-sm">
                    <code className="language-typescript">
                      {`import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const { text } = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Write a haiku about programming.',
});

console.log(text);
// Output: "Code flows like water
//          Bugs swim through logic's currents
//          Debug brings the calm"`}
                    </code>
                  </pre>
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* streamText Example */}
            <AnimatedSection delay={0.3} className="mb-16">
              <h2 className="text-3xl font-bold mb-4">streamText</h2>
              <p className="text-muted-foreground mb-6">
                Use streamText for real-time streaming. Perfect for chat
                interfaces where you want to show text as it&apos;s generated.
              </p>
              <Card className="bg-zinc-950 border-zinc-800 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="ml-2 text-sm text-zinc-400">
                      streamText Example
                    </span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-sm">
                    <code className="language-typescript">
                      {`import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

const result = streamText({
  model: openai('gpt-4o'),
  messages: [
    { role: 'user', content: 'Explain quantum computing simply.' }
  ],
});

// In an API route, return as a stream response
return result.toDataStreamResponse();

// Or consume the stream directly
for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}`}
                    </code>
                  </pre>
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* generateObject Example */}
            <AnimatedSection delay={0.4} className="mb-16">
              <h2 className="text-3xl font-bold mb-4">generateObject</h2>
              <p className="text-muted-foreground mb-6">
                Use generateObject to get structured, typed data from the AI.
                The response is validated against your Zod schema.
              </p>
              <Card className="bg-zinc-950 border-zinc-800 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="ml-2 text-sm text-zinc-400">
                      generateObject Example
                    </span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-sm">
                    <code className="language-typescript">
                      {`import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const { object } = await generateObject({
  model: openai('gpt-4o'),
  schema: z.object({
    recipe: z.object({
      name: z.string(),
      ingredients: z.array(z.object({
        name: z.string(),
        amount: z.string(),
      })),
      steps: z.array(z.string()),
    }),
  }),
  prompt: 'Generate a recipe for chocolate chip cookies.',
});

// object is fully typed!
console.log(object.recipe.name);
console.log(object.recipe.ingredients);
console.log(object.recipe.steps);`}
                    </code>
                  </pre>
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* Tool Calling */}
            <AnimatedSection delay={0.5} className="mb-16">
              <h2 className="text-3xl font-bold mb-4">Tool Calling</h2>
              <p className="text-muted-foreground mb-6">
                Tools allow the AI to perform actions like searching documents,
                querying databases, or calling external APIs. The AI decides
                when to use tools.
              </p>
              <Card className="bg-zinc-950 border-zinc-800 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="ml-2 text-sm text-zinc-400">
                      Basic Tool Example
                    </span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-sm">
                    <code className="language-typescript">
                      {`import { generateText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const result = await generateText({
  model: openai('gpt-4o'),
  tools: {
    weather: tool({
      description: 'Get the weather for a location',
      parameters: z.object({
        location: z.string().describe('City name'),
      }),
      execute: async ({ location }) => {
        // Call your weather API here
        return { temperature: 72, condition: 'sunny' };
      },
    }),
  },
  prompt: 'What is the weather in San Francisco?',
});

// The AI will call the weather tool and include
// the result in its response`}
                    </code>
                  </pre>
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* Advanced Tool Example - Document Search */}
            <AnimatedSection delay={0.55} className="mb-16">
              <h2 className="text-3xl font-bold mb-4">
                Real-World Tool Example: Document Search
              </h2>
              <p className="text-muted-foreground mb-6">
                Here&apos;s how we implement a document search tool with vector
                embeddings and typed output schema - similar to what this
                project uses:
              </p>
              <Card className="bg-zinc-950 border-zinc-800 overflow-hidden mb-4">
                <CardContent className="p-0">
                  <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="ml-2 text-sm text-zinc-400">
                      tools/documentSearch.ts
                    </span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-sm">
                    <code className="language-typescript">
                      {`import { tool } from 'ai';
import { z } from 'zod';
import { embed } from 'ai';
import { voyage } from 'voyage-ai-provider';

const embeddingModel = voyage.textEmbeddingModel('voyage-3-large');

export const searchUserDocument = ({ userId }: { userId: string }) =>
  tool({
    description: 'Search through user documents to find relevant information',

    // Input schema - what the AI provides
    inputSchema: z.object({
      query: z.string().describe('The search query')
    }),

    // Output schema - what the tool returns (typed!)
    outputSchema: z.object({
      instructions: z.string(),
      context: z.array(z.object({
        type: z.string(),
        title: z.string(),
        page: z.number(),
        content: z.string(),
        pdfLink: z.string()
      }))
    }),

    // Execute function with access to messages
    execute: async ({ query }, { messages }) => {
      // 1. Embed the query
      const { embedding } = await embed({
        model: embeddingModel,
        value: query,
        providerOptions: {
          voyage: { inputType: 'query', outputDimension: 1024 }
        }
      });

      // 2. Search database with vector similarity
      const results = await searchVectors(embedding, userId);

      // 3. Return structured output
      return {
        instructions: 'Use this context to answer the question',
        context: results.map(r => ({
          type: 'document',
          title: r.title,
          page: r.page,
          content: r.text,
          pdfLink: \`<?pdf=\${r.title}&p=\${r.page}>\`
        }))
      };
    }
  });`}
                    </code>
                  </pre>
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* Multi-step Tool Calling */}
            <AnimatedSection delay={0.6} className="mb-16">
              <h2 className="text-3xl font-bold mb-4">
                Multi-step Tool Calling
              </h2>
              <p className="text-muted-foreground mb-6">
                Use <code className="text-primary">maxSteps</code> to allow the
                AI to make multiple tool calls in sequence. The{' '}
                <code className="text-primary">onStepFinish</code> callback lets
                you save each step.
              </p>
              <Card className="bg-zinc-950 border-zinc-800 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="ml-2 text-sm text-zinc-400">
                      Multi-step Example
                    </span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-sm">
                    <code className="language-typescript">
                      {`const result = streamText({
  model: openai('gpt-4o'),
  messages,
  tools: {
    searchDocuments: searchUserDocument({ userId }),
    searchWeb: websiteSearchTool,
  },

  // Allow up to 5 tool calling rounds
  maxSteps: 5,

  // Called after each step completes
  onStepFinish: async ({ stepType, text, toolCalls, toolResults }) => {
    // Save to database incrementally
    if (stepType === 'tool-result') {
      await saveToolResult(chatId, toolCalls, toolResults);
    }
    if (stepType === 'text') {
      await saveTextChunk(chatId, text);
    }
  },

  // Control tool behavior
  toolChoice: 'auto', // 'auto' | 'required' | 'none' | { type: 'tool', toolName: '...' }
});`}
                    </code>
                  </pre>
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* Navigation */}
            <AnimatedSection
              delay={0.65}
              className="flex justify-between items-center pt-8 border-t border-border"
            >
              <Button asChild variant="ghost">
                <Link href="/docs/usechat">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  useChat Hook
                </Link>
              </Button>
              <Button asChild>
                <Link href="/docs/getting-started">
                  Getting Started
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
