'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  MessageSquare,
  Cpu,
  Rocket,
  ArrowRight,
  Sparkles,
  Code2,
  Layers
} from 'lucide-react';

const docSections = [
  {
    href: '/docs/overview',
    icon: BookOpen,
    title: 'AI SDK Overview',
    description:
      'Learn about the Vercel AI SDK, its core concepts, and how it simplifies building AI-powered applications.',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    href: '/docs/usechat',
    icon: MessageSquare,
    title: 'useChat Hook',
    description:
      'Build real-time chat interfaces with the useChat hook. Handle streaming, state management, and UI updates.',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    href: '/docs/core-functions',
    icon: Cpu,
    title: 'Core Functions',
    description:
      'Explore generateText, streamText, generateObject, and other core functions for AI interactions.',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    href: '/docs/getting-started',
    icon: Rocket,
    title: 'Getting Started',
    description:
      'Quick start guide to integrate the AI SDK into your Next.js application in minutes.',
    gradient: 'from-green-500 to-emerald-500'
  }
];

const features = [
  {
    icon: Sparkles,
    title: 'Multiple Providers',
    description: 'OpenAI, Anthropic, Google, and more'
  },
  {
    icon: Code2,
    title: 'TypeScript First',
    description: 'Full type safety and autocompletion'
  },
  {
    icon: Layers,
    title: 'Framework Agnostic',
    description: 'Works with React, Vue, Svelte, and more'
  }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function DocsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-pink-500/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Vercel AI SDK v5</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              AI SDK Documentation
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              The TypeScript toolkit for building AI-powered applications.
              Unified APIs, streaming support, and seamless integration with
              multiple model providers.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/50 backdrop-blur-sm border border-border"
                >
                  <feature.icon className="w-4 h-4 text-primary" />
                  <div className="text-left">
                    <div className="text-sm font-medium">{feature.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {feature.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Documentation Cards */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {docSections.map((section) => {
              const Icon = section.icon;
              return (
                <motion.div key={section.href} variants={item}>
                  <Link href={section.href}>
                    <Card className="group h-full backdrop-blur-sm bg-background/50 border-muted hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 cursor-pointer">
                      <CardContent className="p-8">
                        <div
                          className={`w-14 h-14 rounded-xl bg-gradient-to-r ${section.gradient} p-3 mb-6 group-hover:scale-110 transition-transform duration-300`}
                        >
                          <Icon className="w-full h-full text-white" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                          {section.title}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          {section.description}
                        </p>
                        <div className="flex items-center text-primary font-medium">
                          Learn more
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-8">Ready to Build?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="group bg-gradient-to-r from-primary to-purple-600"
            >
              <Link href="/docs/getting-started">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/chat">Try the AI Chat</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
