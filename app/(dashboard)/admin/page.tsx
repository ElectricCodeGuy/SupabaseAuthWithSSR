import { redirect } from 'next/navigation';
import { getSession } from '@/lib/server/supabase';
import { fetchIsAdmin, fetchAdminDashboard } from './fetch';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { DailyTokensChart } from '@/app/(dashboard)/components/analytics/charts';
import { UsersTable } from './components/UsersTable';
import { Coins, DatabaseZap, MessageSquareText, Users } from 'lucide-react';

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

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/signin');
  if (!(await fetchIsAdmin(session.sub))) redirect('/chat');

  const days = parseRangeDays((await searchParams).days);
  const {
    userCount,
    activeUsers,
    prevActiveUsers,
    totals,
    prevTotals,
    perDayFilled,
    perModel,
    userRows,
    topUsers
  } = await fetchAdminDashboard(days);

  const periodLabel = `previous ${days} days`;
  const maxUserCost = topUsers[0]?.costUsd || 1;

  const topUserItems: BarListItem[] = topUsers.map((u) => ({
    key: u.id,
    label: u.name,
    sublabel: `${compactFormat.format(u.inputTokens + u.outputTokens)} tok`,
    value: costFormat.format(u.costUsd),
    ratio: u.costUsd / maxUserCost
  }));

  const modelItems: BarListItem[] = perModel.map((m) => ({
    key: m.model,
    label: m.model,
    sublabel: `${numberFormat.format(m.steps)} steps`,
    value: costFormat.format(m.costUsd),
    ratio: m.costUsd / (perModel[0]?.costUsd || 1)
  }));

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header + date-range presets: one row, scopes everything below */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            User management and organization-wide AI usage.
          </p>
        </div>
        <RangeTabs basePath="/admin" active={days} />
      </div>

      <div className="space-y-4">
        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Users"
            value={numberFormat.format(userCount)}
            hint={`${numberFormat.format(activeUsers)} active this period`}
            delta={computeDelta(
              activeUsers,
              prevActiveUsers,
              true,
              periodLabel
            )}
            icon={<Users className="h-4 w-4" />}
          />
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
            hint={`${numberFormat.format(totals.steps)} generation steps`}
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
            hint={`saved ~${costFormat.format(totals.cacheSavingsUsd)} via caching`}
            delta={computeDelta(
              totals.cacheHitRate,
              prevTotals.cacheHitRate,
              true,
              periodLabel
            )}
            icon={<DatabaseZap className="h-4 w-4" />}
          />
        </div>

        {/* Org trend */}
        <Card className="gap-2">
          <CardHeader className="pb-0">
            <h3 className="text-sm font-semibold">
              Organization tokens per day
            </h3>
            <p className="text-xs text-muted-foreground">
              Prompt (input) and completion (output) tokens across all users.
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
              <h3 className="text-sm font-semibold">Top users by cost</h3>
              <p className="text-xs text-muted-foreground">
                Estimated spend per user, cache-aware.
              </p>
            </CardHeader>
            <CardContent>
              <BarList items={topUserItems} />
            </CardContent>
          </Card>

          <Card className="gap-2">
            <CardHeader className="pb-0">
              <h3 className="text-sm font-semibold">Cost by model</h3>
              <p className="text-xs text-muted-foreground">
                Estimated spend per model across the organization.
              </p>
            </CardHeader>
            <CardContent>
              <BarList items={modelItems} />
            </CardContent>
          </Card>
        </div>

        {/* User management */}
        <Card className="gap-2">
          <CardHeader className="pb-0">
            <h3 className="text-sm font-semibold">Users</h3>
            <p className="text-xs text-muted-foreground">
              Edit profiles, grant or revoke admin access, and see each
              user&apos;s usage in the selected period. Sorted by cost.
            </p>
          </CardHeader>
          <CardContent>
            <UsersTable users={userRows} currentUserId={session.sub} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
