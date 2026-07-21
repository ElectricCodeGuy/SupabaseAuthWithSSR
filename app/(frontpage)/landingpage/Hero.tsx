import Link from '@/components/link';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  FileSearch,
  Globe,
  ChartColumn,
  Sparkles
} from 'lucide-react';
import { Github } from '@/components/brand-icons';

const GITHUB_URL = 'https://github.com/ElectricCodeGuy/SupabaseAuthWithSSR';

// Pure-CSS product mock: a chat exchange with a tool trace and a usage hint.
// No screenshots to keep in sync — it re-themes with the design tokens.
function ProductMock() {
  return (
    <div className="mx-auto mt-14 w-full max-w-3xl rounded-xl border bg-card shadow-lg">
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 border-b px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-chart-4/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-chart-3/50" />
        <span className="ml-3 text-xs text-muted-foreground">
          AI Chat — Q3 Report Review
        </span>
      </div>

      <div className="space-y-3 p-4 text-left sm:p-6">
        {/* User message */}
        <div className="ml-auto w-fit max-w-[85%] rounded-lg bg-primary/10 px-3 py-2 text-sm">
          What does my uploaded report say about churn, and how does it compare
          to industry benchmarks?
        </div>

        {/* Tool traces */}
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <FileSearch className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium text-foreground">
            Searching your documents
          </span>
          <span>· q3-report.pdf, p. 12 — 2 matches</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <Globe className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium text-foreground">Web search</span>
          <span>· SaaS churn benchmarks 2026 — 5 sources</span>
        </div>

        {/* Assistant answer with a mini chart */}
        <div className="w-fit max-w-[92%] space-y-3 rounded-lg border bg-background px-3 py-2.5 text-sm">
          <p>
            Your Q3 churn of <strong>3.1%</strong> is below the ~4.6% SMB SaaS
            median. Here&apos;s the comparison:
          </p>
          <div
            className="flex h-16 items-end gap-3"
            role="img"
            aria-label="Bar chart comparing churn: yours 3.1%, median 4.6%, top quartile 2.2%"
          >
            {[
              ['Yours', 45, 'var(--chart-1)'],
              ['Median', 68, 'var(--chart-2)'],
              ['Top 25%', 32, 'var(--chart-3)']
            ].map(([label, height, color]) => (
              <div key={label as string} className="flex flex-col items-center gap-1">
                <div
                  className="w-10 rounded-t-[4px]"
                  style={{
                    height: `${height}%`,
                    backgroundColor: color as string
                  }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Usage footer hint */}
        <div className="flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
          <ChartColumn className="h-3 w-3" />
          <span>2,431 tokens · 91% served from cache</span>
        </div>
      </div>
    </div>
  );
}

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

        <ProductMock />

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
