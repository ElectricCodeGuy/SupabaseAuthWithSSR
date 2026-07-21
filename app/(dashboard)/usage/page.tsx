import { getSession } from '@/lib/server/supabase';
import { fetchUsageDashboard } from './fetch';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Link from '@/components/link';
import { Button } from '@/components/ui/button';
import {
  StatCard,
  computeDelta
} from '@/app/(dashboard)/components/analytics/StatCard';
import {
  BarList,
  type BarListItem
} from '@/app/(dashboard)/components/analytics/BarList';
import {
  RangeTabs,
  parseRangeDays
} from '@/app/(dashboard)/components/analytics/RangeTabs';
import {
  DailyTokensChart,
  CacheHitRateChart
} from '@/app/(dashboard)/components/analytics/charts';
import { RecentGenerations } from './components/RecentGenerations';
import {
  Coins,
  DatabaseZap,
  MessageSquareText,
  Wrench,
  ChartColumn
} from 'lucide-react';

const numberFormat = new Intl.NumberFormat('en-US');
const compactFormat = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1
});
const costFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 4
});

export default async function UsagePage({
  searchParams
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              You must be logged in to view this page
            </p>
            <Button asChild className="mt-4">
              <Link href="/signin">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const days = parseRangeDays((await searchParams).days);
  const {
    totals,
    prevTotals,
    perDayFilled,
    perModel,
    perTool,
    topChats,
    recentGenerations
  } = await fetchUsageDashboard(session.sub, days);

  const periodLabel = `previous ${days} days`;
  const maxChatTokens = topChats[0]?.tokens ?? 1;

  const modelItems: BarListItem[] = perModel.map((m) => ({
    key: m.model,
    label: m.model,
    sublabel: `${numberFormat.format(m.steps)} steps`,
    value: costFormat.format(m.costUsd),
    ratio: m.costUsd / (perModel[0]?.costUsd || 1)
  }));

  const toolItems: BarListItem[] = perTool.map((t) => ({
    key: t.tool,
    label: t.tool,
    sublabel: `${numberFormat.format(t.calls)} calls`,
    value: `${compactFormat.format(t.inputTokens + t.outputTokens)} tok`,
    ratio: t.calls / (perTool[0]?.calls || 1)
  }));

  const chatItems: BarListItem[] = topChats.map((chat) => ({
    key: chat.id,
    label: chat.title || 'Untitled chat',
    sublabel: `${numberFormat.format(chat.steps)} steps`,
    value: `${compactFormat.format(chat.tokens)} tok`,
    ratio: chat.tokens / maxChatTokens
  }));

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header + date-range presets: one row, scopes everything below */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usage</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Token usage, prompt-cache performance and estimated cost across your
            chats.
          </p>
        </div>
        <RangeTabs basePath="/usage" active={days} />
      </div>

      {totals.steps === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ChartColumn className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-base font-semibold">No usage yet</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Start a conversation and every generation step — including each
              tool call — will show up here with its token and cache metadata.
            </p>
            <Button asChild className="mt-5">
              <Link href="/chat">Start chatting</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* KPI row */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Total tokens"
              value={compactFormat.format(
                totals.inputTokens + totals.outputTokens
              )}
              hint={`${compactFormat.format(totals.inputTokens)} in · ${compactFormat.format(totals.outputTokens)} out`}
              delta={computeDelta(
                totals.inputTokens + totals.outputTokens,
                prevTotals.inputTokens + prevTotals.outputTokens,
                null,
                periodLabel
              )}
              icon={<Coins className="h-4 w-4" />}
            />
            <StatCard
              label="Estimated cost"
              value={costFormat.format(totals.estimatedCostUsd)}
              hint={`saved ~${costFormat.format(totals.cacheSavingsUsd)} via caching`}
              delta={computeDelta(
                totals.estimatedCostUsd,
                prevTotals.estimatedCostUsd,
                null,
                periodLabel
              )}
              icon={<MessageSquareText className="h-4 w-4" />}
            />
            <StatCard
              label="Cache hit rate"
              value={`${totals.cacheHitRate.toFixed(1)}%`}
              hint={`${compactFormat.format(totals.cacheReadTokens)} tokens read from cache`}
              delta={computeDelta(
                totals.cacheHitRate,
                prevTotals.cacheHitRate,
                true,
                periodLabel
              )}
              icon={<DatabaseZap className="h-4 w-4" />}
            />
            <StatCard
              label="Generation steps"
              value={numberFormat.format(totals.steps)}
              hint={`${numberFormat.format(totals.toolCalls)} tool calls`}
              delta={computeDelta(
                totals.steps,
                prevTotals.steps,
                null,
                periodLabel
              )}
              icon={<Wrench className="h-4 w-4" />}
            />
          </div>

          {/* Main trend */}
          <Card className="gap-2">
            <CardHeader className="pb-0">
              <h3 className="text-sm font-semibold">Tokens per day</h3>
              <p className="text-xs text-muted-foreground">
                Prompt (input) and completion (output) tokens across all your
                chats.
              </p>
            </CardHeader>
            <CardContent>
              <DailyTokensChart data={perDayFilled} />
            </CardContent>
          </Card>

          {/* Breakdown row */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="gap-2">
              <CardHeader className="pb-0">
                <h3 className="text-sm font-semibold">Cache hit rate</h3>
                <p className="text-xs text-muted-foreground">
                  Share of prompt tokens served from Anthropic&apos;s cache
                  (reads cost ~10% of the normal input price).
                </p>
              </CardHeader>
              <CardContent>
                <CacheHitRateChart data={perDayFilled} />
              </CardContent>
            </Card>

            <Card className="gap-2">
              <CardHeader className="pb-0">
                <h3 className="text-sm font-semibold">Cost by model</h3>
                <p className="text-xs text-muted-foreground">
                  Estimated spend per model, cache-aware.
                </p>
              </CardHeader>
              <CardContent>
                <BarList items={modelItems} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="gap-2">
              <CardHeader className="pb-0">
                <h3 className="text-sm font-semibold">Usage by tool</h3>
                <p className="text-xs text-muted-foreground">
                  Steps in which each tool ran, with the tokens those steps
                  consumed.
                </p>
              </CardHeader>
              <CardContent>
                <BarList items={toolItems} />
              </CardContent>
            </Card>

            <Card className="gap-2">
              <CardHeader className="pb-0">
                <h3 className="text-sm font-semibold">Top conversations</h3>
                <p className="text-xs text-muted-foreground">
                  Where the tokens went, by chat.
                </p>
              </CardHeader>
              <CardContent>
                <BarList items={chatItems} />
              </CardContent>
            </Card>
          </div>

          {/* Drill-down */}
          <Card className="gap-2">
            <CardHeader className="pb-0">
              <h3 className="text-sm font-semibold">Recent generations</h3>
              <p className="text-xs text-muted-foreground">
                One row per assistant message — expand a row to see its
                individual steps (each tool call is its own step) with their
                token and cache metadata.
              </p>
            </CardHeader>
            <CardContent>
              <RecentGenerations groups={recentGenerations} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
