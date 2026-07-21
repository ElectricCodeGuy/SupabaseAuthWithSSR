import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type {
  StepUsage,
  UsageStepRow,
  UsageSummary,
  UsageMessageGroup,
  DailyUsage,
  ToolUsage,
  ModelUsage
} from '@/types/usage';

// Anthropic prompt-cache pricing multipliers relative to the base input
// price: cache reads cost 0.1×, cache writes 1.25×.
const CACHE_READ_MULTIPLIER = 0.1;
const CACHE_WRITE_MULTIPLIER = 1.25;

export interface ModelPricing {
  model_id: string;
  input_cost_per_million_usd: number;
  output_cost_per_million_usd: number;
}

// Narrow the stored jsonb to StepUsage — tolerate old/malformed rows.
function parseStepUsage(value: unknown): StepUsage | null {
  if (!value || typeof value !== 'object') return null;
  const u = value as Partial<StepUsage>;
  if (typeof u.input_tokens !== 'number' || typeof u.output_tokens !== 'number')
    return null;
  return {
    model_id: typeof u.model_id === 'string' ? u.model_id : 'unknown',
    input_tokens: u.input_tokens,
    output_tokens: u.output_tokens,
    cache_read_tokens:
      typeof u.cache_read_tokens === 'number' ? u.cache_read_tokens : 0,
    cache_write_tokens:
      typeof u.cache_write_tokens === 'number' ? u.cache_write_tokens : 0,
    tools: Array.isArray(u.tools) ? u.tools.filter((t) => typeof t === 'string') : []
  };
}

// Fetch usage-carrying message parts for ONE user via a client whose RLS (or
// service role) permits it. Newest first, capped. `beforeDays` bounds the
// window on the other side (rows OLDER than that many days are the
// "previous period") — fetch the two periods separately so the row cap
// truncates each window independently instead of silently dropping the
// entire older window first.
export async function fetchUsageSteps(
  supabase: SupabaseClient<Database>,
  {
    userId,
    sinceDays = 30,
    beforeDays,
    limit = 2000
  }: {
    userId?: string;
    sinceDays?: number;
    beforeDays?: number;
    limit?: number;
  } = {}
): Promise<Array<UsageStepRow & { userId: string }>> {
  const since = new Date();
  since.setDate(since.getDate() - sinceDays);

  let query = supabase
    .from('message_parts')
    .select(
      'id, message_id, created_at, chat_session_id, usage, chat_sessions!inner(id, user_id, chat_title)'
    )
    .not('usage', 'is', null)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(limit);

  if (beforeDays !== undefined) {
    const before = new Date();
    before.setDate(before.getDate() - beforeDays);
    query = query.lt('created_at', before.toISOString());
  }

  if (userId) {
    query = query.eq('chat_sessions.user_id', userId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching usage steps:', error);
    return [];
  }

  const rows: Array<UsageStepRow & { userId: string }> = [];
  for (const row of data ?? []) {
    // Typecast the jsonb column to the typed StepUsage shape.
    const usage = parseStepUsage(row.usage);
    if (!usage) continue;
    rows.push({
      id: row.id,
      messageId: row.message_id,
      createdAt: row.created_at,
      chatSessionId: row.chat_session_id,
      chatTitle: row.chat_sessions.chat_title,
      userId: row.chat_sessions.user_id,
      usage
    });
  }
  return rows;
}

export function estimateStepCostUsd(
  usage: StepUsage,
  pricing: Map<string, ModelPricing>
): number {
  const model = pricing.get(usage.model_id);
  if (!model) return 0;
  const uncachedInput = Math.max(
    0,
    usage.input_tokens - usage.cache_read_tokens - usage.cache_write_tokens
  );
  const inputCost =
    ((uncachedInput +
      usage.cache_read_tokens * CACHE_READ_MULTIPLIER +
      usage.cache_write_tokens * CACHE_WRITE_MULTIPLIER) /
      1_000_000) *
    model.input_cost_per_million_usd;
  const outputCost =
    (usage.output_tokens / 1_000_000) * model.output_cost_per_million_usd;
  return inputCost + outputCost;
}

// What the cached reads WOULD have cost at full input price, minus what they
// actually cost — i.e. money saved by prompt caching.
function estimateCacheSavingsUsd(
  usage: StepUsage,
  pricing: Map<string, ModelPricing>
): number {
  const model = pricing.get(usage.model_id);
  if (!model) return 0;
  return (
    ((usage.cache_read_tokens * (1 - CACHE_READ_MULTIPLIER)) / 1_000_000) *
    model.input_cost_per_million_usd
  );
}

export function summarizeUsage(
  rows: UsageStepRow[],
  pricing: Map<string, ModelPricing>,
  { recentLimit = 25 }: { recentLimit?: number } = {}
): UsageSummary {
  const totals = {
    steps: rows.length,
    toolCalls: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    cacheHitRate: 0,
    estimatedCostUsd: 0,
    cacheSavingsUsd: 0
  };

  const byDay = new Map<string, DailyUsage>();
  const byTool = new Map<string, ToolUsage>();
  const byModel = new Map<string, ModelUsage>();

  for (const row of rows) {
    const u = row.usage;
    const stepCost = estimateStepCostUsd(u, pricing);
    totals.inputTokens += u.input_tokens;
    totals.outputTokens += u.output_tokens;
    totals.cacheReadTokens += u.cache_read_tokens;
    totals.cacheWriteTokens += u.cache_write_tokens;
    totals.toolCalls += u.tools.length;
    totals.estimatedCostUsd += stepCost;
    totals.cacheSavingsUsd += estimateCacheSavingsUsd(u, pricing);

    const model = byModel.get(u.model_id) ?? {
      model: u.model_id,
      steps: 0,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0
    };
    model.steps += 1;
    model.inputTokens += u.input_tokens;
    model.outputTokens += u.output_tokens;
    model.costUsd += stepCost;
    byModel.set(u.model_id, model);

    const date = row.createdAt.slice(0, 10);
    const day = byDay.get(date) ?? {
      date,
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheHitRate: 0
    };
    day.inputTokens += u.input_tokens;
    day.outputTokens += u.output_tokens;
    day.cacheReadTokens += u.cache_read_tokens;
    byDay.set(date, day);

    for (const tool of u.tools) {
      const t = byTool.get(tool) ?? {
        tool,
        calls: 0,
        inputTokens: 0,
        outputTokens: 0
      };
      t.calls += 1;
      // A step with N tool calls attributes its tokens to each tool evenly.
      t.inputTokens += Math.round(u.input_tokens / u.tools.length);
      t.outputTokens += Math.round(u.output_tokens / u.tools.length);
      byTool.set(tool, t);
    }
  }

  totals.cacheHitRate =
    totals.inputTokens > 0
      ? (totals.cacheReadTokens / totals.inputTokens) * 100
      : 0;

  const perDay = [...byDay.values()]
    .map((d) => ({
      ...d,
      cacheHitRate: d.inputTokens > 0 ? (d.cacheReadTokens / d.inputTokens) * 100 : 0
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const perTool = [...byTool.values()].sort((a, b) => b.calls - a.calls);
  const perModel = [...byModel.values()].sort((a, b) => b.costUsd - a.costUsd);

  return {
    totals,
    perDay,
    perTool,
    perModel,
    recentSteps: rows.slice(0, recentLimit)
  };
}

// Fill days with no usage so the daily chart has a continuous axis for the
// whole selected window (sparse data otherwise renders as 2-3 lonely bars).
// Buckets are keyed by the UTC calendar day of created_at, so the axis is
// generated in UTC too — starting at the UTC day of the fetch cutoff
// (now - sinceDays), which is the oldest day that can appear in the data.
export function fillDailyGaps(
  perDay: DailyUsage[],
  sinceDays: number
): DailyUsage[] {
  const byDate = new Map(perDay.map((d) => [d.date, d]));
  const filled: DailyUsage[] = [];
  const now = new Date();
  const dayMs = 86_400_000;
  const startMs = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - sinceDays
  );
  const endMs = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  for (let ms = startMs; ms <= endMs; ms += dayMs) {
    const key = new Date(ms).toISOString().slice(0, 10);
    filled.push(
      byDate.get(key) ?? {
        date: key,
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheHitRate: 0
      }
    );
  }
  return filled;
}

export async function fetchModelPricing(
  supabase: SupabaseClient<Database>
): Promise<Map<string, ModelPricing>> {
  const { data } = await supabase
    .from('ai_models')
    .select('model_id, input_cost_per_million_usd, output_cost_per_million_usd');
  return new Map((data ?? []).map((m) => [m.model_id, m]));
}

// Group step rows (newest-first) into one entry per assistant message —
// the collapsed rows of the usage table; each group expands to its steps.
export function groupStepsByMessage(
  rows: UsageStepRow[],
  { limit = 25 }: { limit?: number } = {}
): UsageMessageGroup[] {
  const groups = new Map<string, UsageMessageGroup>();

  for (const row of rows) {
    const group = groups.get(row.messageId) ?? {
      messageId: row.messageId,
      chatSessionId: row.chatSessionId,
      chatTitle: row.chatTitle,
      createdAt: row.createdAt,
      steps: [],
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      tools: []
    };

    group.steps.push(row);
    group.inputTokens += row.usage.input_tokens;
    group.outputTokens += row.usage.output_tokens;
    group.cacheReadTokens += row.usage.cache_read_tokens;
    for (const tool of row.usage.tools) {
      if (!group.tools.includes(tool)) group.tools.push(tool);
    }
    // Rows arrive newest-first; keep the earliest step time as the
    // message's start and the steps in execution order.
    if (row.createdAt < group.createdAt) group.createdAt = row.createdAt;

    groups.set(row.messageId, group);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      steps: [...group.steps].sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt)
      )
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}
