// Horizontal proportional bar list ("top pages" style) — the readable
// alternative to a pie chart for single-metric breakdowns. Values are also
// shown as text, so nothing is color-gated.

export interface BarListItem {
  key: string;
  label: string;
  sublabel?: string;
  // Right-aligned formatted value, e.g. "12.4K" or "$0.0312"
  value: string;
  // 0..1 share of the largest item — drives the bar width
  ratio: number;
}

export function BarList({ items }: { items: BarListItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-muted-foreground">
        No data in this period.
      </p>
    );
  }

  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.key}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium text-foreground">
              {item.label}
              {item.sublabel && (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  {item.sublabel}
                </span>
              )}
            </span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {item.value}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(2, Math.round(item.ratio * 100))}%`,
                backgroundColor: 'var(--chart-1)'
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
