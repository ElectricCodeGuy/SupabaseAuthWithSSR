'use client';

// The two shared dashboard charts (recharts must run client-side; everything
// else on the usage/admin pages is server-rendered). Colors come from the
// validated --chart-1..5 tokens; series keep fixed slots, one y-axis per
// chart, a legend whenever there are ≥ 2 series, and one tooltip that lists
// every series at the hovered x.
import React from 'react';
import type { DailyUsage } from '@/types/usage';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const numberFormat = new Intl.NumberFormat('en-US');
const compactFormat = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1
});

const tooltipStyle: React.CSSProperties = {
  backgroundColor: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--popover-foreground)',
  fontSize: 12,
  boxShadow: 'var(--shadow-md)'
};
const axisTick = { fill: 'var(--muted-foreground)', fontSize: 11 };
const gridProps = {
  stroke: 'var(--border)',
  strokeDasharray: '3 3',
  vertical: false
};

// "07-14" from "2026-07-14" → "Jul 14"
function formatDateTick(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function DailyTokensChart({
  data,
  height = 280
}: {
  data: DailyUsage[];
  height?: number;
}) {
  // Keep the axis readable on 90d ranges — label roughly every ~12th day.
  const tickInterval = Math.max(0, Math.ceil(data.length / 12) - 1);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barCategoryGap="25%" barGap={2}>
        <CartesianGrid {...gridProps} />
        <XAxis
          dataKey="date"
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: 'var(--border)' }}
          tickFormatter={formatDateTick}
          interval={tickInterval}
        />
        <YAxis
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={(v: number) => compactFormat.format(v)}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
          labelFormatter={(label: unknown) => formatDateTick(String(label ?? ''))}
          formatter={(value: unknown) =>
            typeof value === 'number'
              ? numberFormat.format(value)
              : String(value ?? '')
          }
        />
        <Legend wrapperStyle={{ fontSize: 12, color: 'var(--foreground)' }} />
        <Bar
          dataKey="inputTokens"
          name="Input"
          fill="var(--chart-1)"
          radius={[4, 4, 0, 0]}
          maxBarSize={36}
        />
        <Bar
          dataKey="outputTokens"
          name="Output"
          fill="var(--chart-2)"
          radius={[4, 4, 0, 0]}
          maxBarSize={36}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CacheHitRateChart({
  data,
  height = 220
}: {
  data: DailyUsage[];
  height?: number;
}) {
  const tickInterval = Math.max(0, Math.ceil(data.length / 8) - 1);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <CartesianGrid {...gridProps} />
        <XAxis
          dataKey="date"
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: 'var(--border)' }}
          tickFormatter={formatDateTick}
          interval={tickInterval}
        />
        <YAxis
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={44}
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ stroke: 'var(--border)' }}
          labelFormatter={(label: unknown) => formatDateTick(String(label ?? ''))}
          formatter={(value: unknown) =>
            typeof value === 'number'
              ? `${value.toFixed(1)}%`
              : String(value ?? '')
          }
        />
        <Area
          type="monotone"
          dataKey="cacheHitRate"
          name="Cache hit rate"
          stroke="var(--chart-3)"
          strokeWidth={2}
          fill="var(--chart-3)"
          fillOpacity={0.12}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
