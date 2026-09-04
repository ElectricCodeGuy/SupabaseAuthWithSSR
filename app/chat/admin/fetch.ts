import 'server-only';

// All server fetching + aggregation for /admin. The page gates access,
// formats and renders what this returns.
import { createServerSupabaseClient } from '@/lib/server/server';
import { createAdminClient } from '@/lib/server/admin';
import {
  fetchUsageSteps,
  fetchModelPricing,
  summarizeUsage,
  fillDailyGaps,
  estimateStepCostUsd
} from '@/lib/server/usage';
import type { AdminUserRow } from './components/UsersTable';

// Gate on the caller's own users row (RLS-readable).
export async function fetchIsAdmin(userId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const { data: me } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle();
  return !!me?.is_admin;
}

interface TopUser {
  id: string;
  name: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export async function fetchAdminDashboard(days: number) {
  // Cross-user data requires the service-role client (bypasses RLS) —
  // strictly server-side, and only after the admin check above. The previous
  // window (for the deltas) is fetched as its own capped query so the row
  // cap can't silently swallow the older period.
  const admin = createAdminClient();
  const [{ data: users }, current, previous, pricing] = await Promise.all([
    admin
      .from('users')
      .select('id, full_name, email, is_admin, selected_model')
      .order('email'),
    fetchUsageSteps(admin, { sinceDays: days, limit: 20000 }),
    fetchUsageSteps(admin, {
      sinceDays: days * 2,
      beforeDays: days,
      limit: 20000
    }),
    fetchModelPricing(admin)
  ]);
  const { totals, perDay, perModel } = summarizeUsage(current, pricing, {
    recentLimit: 0
  });
  const prevTotals = summarizeUsage(previous, pricing, {
    recentLimit: 0
  }).totals;
  const perDayFilled = fillDailyGaps(perDay, days);

  // Per-user aggregates for the table + top-users list.
  const perUser = new Map<
    string,
    {
      inputTokens: number;
      outputTokens: number;
      cacheReadTokens: number;
      steps: number;
      costUsd: number;
    }
  >();
  for (const row of current) {
    const agg = perUser.get(row.userId) ?? {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      steps: 0,
      costUsd: 0
    };
    agg.inputTokens += row.usage.input_tokens;
    agg.outputTokens += row.usage.output_tokens;
    agg.cacheReadTokens += row.usage.cache_read_tokens;
    agg.steps += 1;
    agg.costUsd += estimateStepCostUsd(row.usage, pricing);
    perUser.set(row.userId, agg);
  }
  const prevActiveUsers = new Set(previous.map((r) => r.userId)).size;

  const userRows: AdminUserRow[] = (users ?? [])
    .map((u) => {
      const usage = perUser.get(u.id);
      return {
        id: u.id,
        fullName: u.full_name,
        email: u.email,
        isAdmin: u.is_admin,
        selectedModel: u.selected_model,
        inputTokens: usage?.inputTokens ?? 0,
        outputTokens: usage?.outputTokens ?? 0,
        cacheHitRate:
          usage && usage.inputTokens > 0
            ? (usage.cacheReadTokens / usage.inputTokens) * 100
            : 0,
        steps: usage?.steps ?? 0,
        costUsd: usage?.costUsd ?? 0
      };
    })
    .sort((a, b) => b.costUsd - a.costUsd);

  const nameById = new Map(
    (users ?? []).map((u) => [u.id, u.full_name || u.email])
  );
  const topUsers: TopUser[] = [...perUser.entries()]
    .sort(([, a], [, b]) => b.costUsd - a.costUsd)
    .slice(0, 6)
    .map(([id, agg]) => ({
      id,
      name: nameById.get(id) ?? 'Unknown user',
      inputTokens: agg.inputTokens,
      outputTokens: agg.outputTokens,
      costUsd: agg.costUsd
    }));

  return {
    userCount: (users ?? []).length,
    activeUsers: perUser.size,
    prevActiveUsers,
    totals,
    prevTotals,
    perDayFilled,
    perModel,
    userRows,
    topUsers
  };
}
