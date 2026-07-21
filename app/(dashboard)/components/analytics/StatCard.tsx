// Stat tile per the dashboard spec: label (sentence case), big value in
// proportional figures (tabular-nums is reserved for table columns), an
// optional signed delta vs the previous period, and a muted hint line.
import React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export interface StatDelta {
  // Percent change vs the previous period, already rounded, e.g. 12 or -4.
  percent: number;
  // Whether an increase is a good thing (colors the delta). null = neutral
  // (tokens/cost going up is neither good nor bad — shown muted).
  upIsGood: boolean | null;
  periodLabel: string;
}

// Compute a delta between two period values. Returns null when the previous
// period has no data (a delta vs nothing is noise, not signal).
export function computeDelta(
  current: number,
  previous: number,
  upIsGood: boolean | null,
  periodLabel: string
): StatDelta | null {
  if (previous <= 0) return null;
  const percent = Math.round(((current - previous) / previous) * 100);
  return { percent, upIsGood, periodLabel };
}

function DeltaBadge({ delta }: { delta: StatDelta }) {
  const flat = delta.percent === 0;
  const up = delta.percent > 0;
  const color =
    delta.upIsGood === null || flat
      ? 'text-muted-foreground'
      : up === delta.upIsGood
        ? 'text-green-600 dark:text-green-400'
        : 'text-red-600 dark:text-red-400';
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${color}`}
      title={`vs ${delta.periodLabel}`}
    >
      <Icon className="h-3 w-3" />
      <span>{`${up ? '+' : ''}${delta.percent}%`}</span>
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  delta,
  icon
}: {
  label: string;
  value: string;
  hint?: string;
  delta?: StatDelta | null;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="gap-0 py-4">
      <CardContent className="px-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {icon && (
            <span className="text-muted-foreground/70" aria-hidden>
              {icon}
            </span>
          )}
        </div>
        <div className="mt-1.5 flex items-baseline gap-2">
          <p className="text-2xl font-semibold leading-none tracking-tight">
            {value}
          </p>
          {delta && <DeltaBadge delta={delta} />}
        </div>
        {hint && (
          <p className="mt-1.5 truncate text-xs text-muted-foreground">
            {hint}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
