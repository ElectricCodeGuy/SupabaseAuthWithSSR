import 'server-only';

// All server fetching + aggregation for /usage. The page only formats and
// renders what this returns.
import { createServerSupabaseClient } from '@/lib/server/server';
import {
  fetchUsageSteps,
  fetchModelPricing,
  summarizeUsage,
  fillDailyGaps,
  groupStepsByMessage
} from '@/lib/server/usage';

interface TopChat {
  id: string;
  title: string | null;
  tokens: number;
  steps: number;
}

export async function fetchUsageDashboard(userId: string, days: number) {
  // The previous window (for the period-over-period deltas) is fetched as
  // its OWN capped query — a single doubled-window fetch would drop the
  // oldest rows first under the cap and silently hollow out the deltas.
  // RLS scopes everything to the caller.
  const supabase = await createServerSupabaseClient();
  const [current, previous, pricing] = await Promise.all([
    fetchUsageSteps(supabase, { userId, sinceDays: days, limit: 4000 }),
    fetchUsageSteps(supabase, {
      userId,
      sinceDays: days * 2,
      beforeDays: days,
      limit: 4000
    }),
    fetchModelPricing(supabase)
  ]);
  const summary = summarizeUsage(current, pricing, { recentLimit: 120 });
  const recentGenerations = groupStepsByMessage(summary.recentSteps, {
    limit: 25
  });
  const prevTotals = summarizeUsage(previous, pricing, {
    recentLimit: 0
  }).totals;

  const { totals, perDay, perTool, perModel } = summary;
  const perDayFilled = fillDailyGaps(perDay, days);

  // Top conversations by total tokens — the "where did it all go" view.
  const byChat = new Map<
    string,
    { title: string | null; tokens: number; steps: number }
  >();
  for (const row of current) {
    const chat = byChat.get(row.chatSessionId) ?? {
      title: row.chatTitle,
      tokens: 0,
      steps: 0
    };
    chat.tokens += row.usage.input_tokens + row.usage.output_tokens;
    chat.steps += 1;
    if (!chat.title && row.chatTitle) chat.title = row.chatTitle;
    byChat.set(row.chatSessionId, chat);
  }
  const topChats: TopChat[] = [...byChat.entries()]
    .sort(([, a], [, b]) => b.tokens - a.tokens)
    .slice(0, 6)
    .map(([id, chat]) => ({ id, ...chat }));

  return {
    totals,
    prevTotals,
    perDayFilled,
    perModel,
    perTool,
    topChats,
    recentGenerations
  };
}
