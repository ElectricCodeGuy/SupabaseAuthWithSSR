// Renders the createChart tool's spec with recharts. Colors come from the
// --chart-1..5 CSS tokens (validated colorblind-safe palette, dark mode
// switches automatically). Series are assigned to slots in fixed order and
// never cycled — the tool caps series at 5, and pies fold extra slices into
// "Other".
import React from 'react';
import { BarChart3, Loader2, XCircle } from 'lucide-react';
import type { ToolUIPart } from 'ai';
import type { UITools } from '@/app/(dashboard)/chat/types/tooltypes';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

interface ChartToolProps {
  toolInvocation: Extract<ToolUIPart<UITools>, { type: 'tool-createChart' }>;
  index: string;
}

// Fixed slot order — series 1 is always --chart-1, never re-assigned when
// the series count changes.
const SERIES_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)'
];
const MAX_PIE_SLICES = 5;

const numberFormat = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2
});

const tooltipStyle: React.CSSProperties = {
  backgroundColor: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--popover-foreground)',
  fontSize: 12
};

const axisTick = { fill: 'var(--muted-foreground)', fontSize: 11 };

export const ChartTool: React.FC<ChartToolProps> = ({
  toolInvocation,
  index
}) => {
  const input =
    toolInvocation.state === 'input-available' ||
    toolInvocation.state === 'output-available'
      ? toolInvocation.input
      : undefined;

  if (toolInvocation.state === 'output-error') {
    return (
      <div className="my-2 flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-xs text-red-600 dark:text-red-400">
        <XCircle className="h-4 w-4 flex-shrink-0" />
        <span>{`Chart failed: ${toolInvocation.errorText || 'unknown error'}`}</span>
      </div>
    );
  }

  if (!input || !input.series || input.series.length === 0) {
    return (
      <div className="my-2 flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Preparing chart…</span>
      </div>
    );
  }

  const { type, title, description, xAxisLabel, yAxisLabel, series } = input;

  // Shared row shape for cartesian charts: one row per label, one key per
  // series. Series were validated server-side to have aligned labels.
  const rows = series[0].data.map((point, i) => {
    const row: Record<string, string | number> = { label: point.label };
    for (const s of series) {
      row[s.name] = s.data[i]?.value ?? 0;
    }
    return row;
  });

  // Pie: first series only; beyond 5 slices, fold the smallest into "Other"
  // instead of inventing a 6th hue.
  const pieData = (() => {
    const points = [...series[0].data].sort((a, b) => b.value - a.value);
    if (points.length <= MAX_PIE_SLICES) return points;
    const kept = points.slice(0, MAX_PIE_SLICES - 1);
    const rest = points.slice(MAX_PIE_SLICES - 1);
    return [
      ...kept,
      { label: 'Other', value: rest.reduce((sum, p) => sum + p.value, 0) }
    ];
  })();

  const showLegend = type !== 'pie' && series.length >= 2;
  const legendProps = {
    wrapperStyle: { fontSize: 12, color: 'var(--foreground)' }
  };
  const gridProps = {
    stroke: 'var(--border)',
    strokeDasharray: '3 3',
    vertical: false
  };
  const tooltipProps = {
    contentStyle: tooltipStyle,
    cursor: { fill: 'var(--muted)', opacity: 0.4 },
    formatter: (value: unknown) =>
      typeof value === 'number' ? numberFormat.format(value) : String(value ?? '')
  };

  return (
    <div className="my-3 rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-start gap-2">
        <BarChart3 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
        <div>
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        {type === 'bar' ? (
          <BarChart data={rows} barCategoryGap="20%" barGap={2}>
            <CartesianGrid {...gridProps} />
            <XAxis
              dataKey="label"
              tick={axisTick}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              label={
                xAxisLabel
                  ? { value: xAxisLabel, position: 'insideBottom', offset: -4, fontSize: 11, fill: 'var(--muted-foreground)' }
                  : undefined
              }
            />
            <YAxis
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              width={48}
              label={
                yAxisLabel
                  ? { value: yAxisLabel, angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--muted-foreground)' }
                  : undefined
              }
            />
            <Tooltip {...tooltipProps} />
            {showLegend && <Legend {...legendProps} />}
            {series.map((s, i) => (
              <Bar
                key={s.name}
                dataKey={s.name}
                fill={SERIES_COLORS[i]}
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            ))}
          </BarChart>
        ) : type === 'line' ? (
          <LineChart data={rows}>
            <CartesianGrid {...gridProps} />
            <XAxis
              dataKey="label"
              tick={axisTick}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <YAxis tick={axisTick} tickLine={false} axisLine={false} width={48} />
            <Tooltip {...tooltipProps} cursor={{ stroke: 'var(--border)' }} />
            {showLegend && <Legend {...legendProps} />}
            {series.map((s, i) => (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={SERIES_COLORS[i]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        ) : type === 'area' ? (
          <AreaChart data={rows}>
            <CartesianGrid {...gridProps} />
            <XAxis
              dataKey="label"
              tick={axisTick}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <YAxis tick={axisTick} tickLine={false} axisLine={false} width={48} />
            <Tooltip {...tooltipProps} cursor={{ stroke: 'var(--border)' }} />
            {showLegend && <Legend {...legendProps} />}
            {series.map((s, i) => (
              <Area
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={SERIES_COLORS[i]}
                strokeWidth={2}
                fill={SERIES_COLORS[i]}
                fillOpacity={0.15}
              />
            ))}
          </AreaChart>
        ) : (
          <PieChart>
            <Tooltip {...tooltipProps} cursor={false} />
            <Legend {...legendProps} />
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="label"
              innerRadius={60}
              outerRadius={100}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {pieData.map((point, i) => (
                <Cell
                  key={point.label}
                  fill={
                    point.label === 'Other'
                      ? 'var(--muted-foreground)'
                      : SERIES_COLORS[i]
                  }
                />
              ))}
            </Pie>
          </PieChart>
        )}
      </ResponsiveContainer>

      {/* Table view of the same data — accessibility fallback and the
          "relief" for series colors that sit under 3:1 contrast in light
          mode. */}
      <Accordion type="single" collapsible>
        <AccordionItem value={`chart-data-${index}`} className="border-none">
          <AccordionTrigger className="py-1 text-xs text-muted-foreground hover:no-underline">
            View data
          </AccordionTrigger>
          <AccordionContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-1 pr-4 font-medium">
                      {xAxisLabel || 'Label'}
                    </th>
                    {series.map((s) => (
                      <th key={s.name} className="py-1 pr-4 font-medium">
                        {s.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={String(row.label)} className="border-b border-border/50">
                      <td className="py-1 pr-4 text-foreground">{row.label}</td>
                      {series.map((s) => (
                        <td key={s.name} className="py-1 pr-4 text-foreground">
                          {numberFormat.format(Number(row[s.name]))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
