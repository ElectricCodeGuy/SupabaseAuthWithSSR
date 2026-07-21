'use client';

// Recent generations table: one collapsed row per assistant MESSAGE, with a
// chevron that expands the per-step breakdown (each tool call is its own
// step) underneath it.
import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { UsageMessageGroup } from '@/types/usage';
import Link from '@/components/link';

const numberFormat = new Intl.NumberFormat('en-US');
const dateTimeFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

function cachedPct(cacheRead: number, input: number): string {
  return input > 0 ? `${((cacheRead / input) * 100).toFixed(0)}%` : '0%';
}

function ToolBadges({ tools, id }: { tools: string[]; id: string }) {
  if (tools.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <span className="flex flex-wrap gap-1">
      {tools.map((tool, i) => (
        <span
          key={`${id}-${tool}-${i}`}
          className="inline-flex rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-secondary-foreground"
        >
          {tool}
        </span>
      ))}
    </span>
  );
}

export function RecentGenerations({
  groups
}: {
  groups: UsageMessageGroup[];
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (messageId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  if (groups.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-muted-foreground">
        No generations in this period.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="w-8 py-2" aria-label="Expand" />
            <th className="py-2 pr-4 font-medium">When</th>
            <th className="py-2 pr-4 font-medium">Chat</th>
            <th className="py-2 pr-4 font-medium">Tools</th>
            <th className="py-2 pr-4 text-right font-medium">In</th>
            <th className="py-2 pr-4 text-right font-medium">Out</th>
            <th className="py-2 text-right font-medium">Cached</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            const isOpen = expanded.has(group.messageId);
            const stepLabel = `${group.steps.length} step${group.steps.length === 1 ? '' : 's'}`;
            return (
              <Fragment key={group.messageId}>
                {/* Collapsed message row */}
                <tr
                  className="cursor-pointer border-b border-border/50 hover:bg-muted/40"
                  onClick={() => toggle(group.messageId)}
                >
                  <td className="py-2 pl-1">
                    <button
                      type="button"
                      className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      aria-expanded={isOpen}
                      aria-label={
                        isOpen ? 'Collapse steps' : `Expand ${stepLabel}`
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(group.messageId);
                      }}
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                  <td className="whitespace-nowrap py-2 pr-4 text-xs text-muted-foreground">
                    {dateTimeFormat.format(new Date(group.createdAt))}
                  </td>
                  <td className="max-w-[220px] py-2 pr-4">
                    <Link
                      href={`/chat/${group.chatSessionId}`}
                      className="block truncate font-medium text-foreground hover:text-primary hover:underline"
                      prefetch={false}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {group.chatTitle || 'Untitled chat'}
                    </Link>
                    <span className="text-[11px] text-muted-foreground">
                      {stepLabel}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <ToolBadges tools={group.tools} id={group.messageId} />
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {numberFormat.format(group.inputTokens)}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {numberFormat.format(group.outputTokens)}
                  </td>
                  <td className="py-2 text-right tabular-nums text-muted-foreground">
                    {cachedPct(group.cacheReadTokens, group.inputTokens)}
                  </td>
                </tr>

                {/* Expanded per-step rows */}
                {isOpen &&
                  group.steps.map((step, index) => {
                    const stepCached = cachedPct(
                      step.usage.cache_read_tokens,
                      step.usage.input_tokens
                    );
                    return (
                      <tr
                        key={step.id}
                        className="border-b border-border/30 bg-muted/25 text-xs"
                      >
                        <td className="py-1.5" />
                        <td className="py-1.5 pr-4 text-muted-foreground">
                          <span className="pl-2">{`Step ${index + 1}`}</span>
                        </td>
                        <td className="py-1.5 pr-4 text-muted-foreground">
                          {step.usage.model_id}
                        </td>
                        <td className="py-1.5 pr-4">
                          <ToolBadges tools={step.usage.tools} id={step.id} />
                        </td>
                        <td className="py-1.5 pr-4 text-right tabular-nums">
                          {numberFormat.format(step.usage.input_tokens)}
                        </td>
                        <td className="py-1.5 pr-4 text-right tabular-nums">
                          {numberFormat.format(step.usage.output_tokens)}
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-muted-foreground">
                          {stepCached}
                        </td>
                      </tr>
                    );
                  })}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
