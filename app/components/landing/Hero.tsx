import Link from '@/components/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Github } from '@/components/brand-icons';
import ChatDemo from './ChatDemo';

const GITHUB_URL = 'https://github.com/ElectricCodeGuy/SupabaseAuthWithSSR';

export function Hero({ session }: { session: boolean }) {
  return (
    <section className="relative overflow-hidden border-b">
      {/* Subtle radial accent — one hue, no gradients-of-many-colors */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] opacity-60"
        style={{
          background:
            'radial-gradient(600px 280px at 50% 0%, color-mix(in oklab, var(--primary) 22%, transparent), transparent)'
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
        <Link
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:text-foreground"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Open source · MIT licensed</span>
          <span className="text-border">|</span>
          <span className="inline-flex items-center gap-1">
            <Github className="h-3.5 w-3.5" />
            Star on GitHub
          </span>
        </Link>

        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
          The AI chat starter for Next.js&nbsp;&amp;&nbsp;Supabase
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Production-grade authentication, Claude-powered chat with document
          RAG, an artifacts workspace, long-term memory, and per-token usage
          analytics — ready to clone and ship.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href={session ? '/chat' : '/signup'} prefetch={false}>
              <span>{session ? 'Open the app' : 'Get started free'}</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <Github className="mr-2 h-4 w-4" />
              <span>View source</span>
            </Link>
          </Button>
        </div>

        {/* Live replay of one real multi-tool turn — see ChatDemo. */}
        <div className="mt-14 text-left">
          <ChatDemo />
        </div>

        {/* Stack strip — real, verifiable facts instead of made-up stats */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
          {[
            'Next.js 16',
            'Supabase SSR',
            'AI SDK v7',
            'Anthropic Claude',
            'pgvector',
            'Tailwind v4'
          ].map((item) => (
            <span key={item} className="font-medium">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
