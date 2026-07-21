// Date-range presets — the first filter on any monitoring dashboard. One row,
// above the content, scoping every stat/chart/table below it. Server-driven
// via the ?days= search param, so no client state is needed.
import Link from '@/components/link';

const RANGE_PRESETS = [7, 30, 90] as const;
export type RangeDays = (typeof RANGE_PRESETS)[number];

export function parseRangeDays(value: string | undefined): RangeDays {
  const parsed = Number(value);
  return (RANGE_PRESETS as readonly number[]).includes(parsed)
    ? (parsed as RangeDays)
    : 30;
}

export function RangeTabs({
  basePath,
  active
}: {
  basePath: string;
  active: RangeDays;
}) {
  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-lg border bg-card p-0.5"
      role="tablist"
      aria-label="Date range"
    >
      {RANGE_PRESETS.map((days) => {
        const isActive = days === active;
        return (
          <Link
            key={days}
            href={`${basePath}?days=${days}`}
            role="tab"
            aria-selected={isActive}
            prefetch={false}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            }`}
          >
            {`${days}d`}
          </Link>
        );
      })}
    </div>
  );
}
