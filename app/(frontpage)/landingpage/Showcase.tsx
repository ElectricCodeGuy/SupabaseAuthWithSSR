import { Check } from 'lucide-react';

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Check className="h-3 w-3 text-primary" />
      </span>
      <span className="text-muted-foreground">{children}</span>
    </li>
  );
}

// CSS mock: the usage dashboard's daily-token bars + stat tiles.
function UsageMock() {
  const bars = [28, 42, 35, 60, 48, 78, 64, 90, 70, 55, 82, 68];
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 grid grid-cols-3 gap-2">
        {[
          ['Tokens (30d)', '1.2M'],
          ['Cache hit rate', '87%'],
          ['Est. cost', '$4.21']
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-background p-3">
            <p className="text-[10px] text-muted-foreground">{label}</p>
            <p className="mt-0.5 text-lg font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div
        className="flex h-24 items-end gap-1.5"
        role="img"
        aria-label="Bar chart of daily token usage"
      >
        {bars.map((height, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-[3px]"
            style={{
              height: `${height}%`,
              backgroundColor:
                i % 2 === 0 ? 'var(--chart-1)' : 'var(--chart-2)'
            }}
          />
        ))}
      </div>
      <p className="mt-3 text-[10px] text-muted-foreground">
        Input · Output tokens per day — every step attributed to its tool
      </p>
    </div>
  );
}

// CSS mock: the security/architecture side — RLS + caching pipeline.
function ArchitectureMock() {
  const rows = [
    ['Row Level Security', 'every table, every query'],
    ['Prompt caching', 'static prefix + moving breakpoint'],
    ['Incremental saves', 'each step persisted as it streams'],
    ['Server-only keys', 'nothing sensitive reaches the client']
  ];
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <ul className="divide-y">
        {rows.map(([title, detail]) => (
          <li key={title} className="flex items-baseline justify-between gap-4 py-3">
            <span className="text-sm font-medium">{title}</span>
            <span className="text-right text-xs text-muted-foreground">
              {detail}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Showcase() {
  return (
    <section className="border-b py-20 sm:py-24">
      <div className="mx-auto max-w-6xl space-y-20 px-4 sm:px-6">
        {/* Row 1 — usage analytics */}
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-primary">
              Usage analytics
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Every token accounted for
            </h2>
            <p className="mt-3 text-muted-foreground">
              Each generation step — including every individual tool call —
              stores its token and cache metadata with the message it belongs
              to. Dashboards turn that into answers.
            </p>
            <ul className="mt-6 space-y-3">
              <CheckItem>
                Per-user dashboard: tokens per day, cache hit rate, cost by
                model, usage by tool, per-message drill-down
              </CheckItem>
              <CheckItem>
                Admin view: org-wide totals, top users by cost, and user
                management with role control
              </CheckItem>
              <CheckItem>
                Cache-aware cost estimates using real Anthropic pricing
                multipliers (0.1× reads, 1.25× writes)
              </CheckItem>
            </ul>
          </div>
          <UsageMock />
        </div>

        {/* Row 2 — architecture */}
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="lg:order-2">
            <p className="text-sm font-semibold text-primary">
              Production architecture
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Secure and fast by default
            </h2>
            <p className="mt-3 text-muted-foreground">
              Supabase SSR authentication with row-level security on every
              table, and a two-tier Anthropic prompt-caching setup that serves
              multi-step tool turns from cache at ~10% of the input price.
            </p>
            <ul className="mt-6 space-y-3">
              <CheckItem>
                Cookie-based SSR auth — sessions verified on the server, RLS
                enforced in the database
              </CheckItem>
              <CheckItem>
                Cached static system prompt + a moving breakpoint that follows
                the conversation across tool steps
              </CheckItem>
              <CheckItem>
                One SQL file sets up the entire schema, policies, and hybrid
                search function
              </CheckItem>
            </ul>
          </div>
          <div className="lg:order-1">
            <ArchitectureMock />
          </div>
        </div>
      </div>
    </section>
  );
}
