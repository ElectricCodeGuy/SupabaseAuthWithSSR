// Shape of the per-step usage JSON stored on message_parts.usage (written by
// the chat route via SaveToDbIncremental). Shared by server aggregation and
// the client dashboard components — keep in sync with the writer.
export interface StepUsage {
  model_id: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  // Tool names invoked in this step ([] for a plain answer step).
  tools: string[];
}

export interface UsageStepRow {
  id: string;
  // All steps of one generation share the assistant message id — used to
  // group the usage table by message.
  messageId: string;
  createdAt: string;
  chatSessionId: string;
  chatTitle: string | null;
  usage: StepUsage;
}

// One assistant message (= one generation, possibly many tool steps),
// aggregated for the usage table's collapsed rows.
export interface UsageMessageGroup {
  messageId: string;
  chatSessionId: string;
  chatTitle: string | null;
  createdAt: string;
  steps: UsageStepRow[];
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  tools: string[];
}

export interface DailyUsage {
  date: string; // yyyy-mm-dd
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheHitRate: number; // 0-100
}

export interface ToolUsage {
  tool: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
}

export interface ModelUsage {
  model: string;
  steps: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

interface UsageTotals {
  steps: number;
  toolCalls: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  cacheHitRate: number; // 0-100, share of input served from cache
  estimatedCostUsd: number;
  cacheSavingsUsd: number;
}

export interface UsageSummary {
  totals: UsageTotals;
  perDay: DailyUsage[];
  perTool: ToolUsage[];
  perModel: ModelUsage[];
  recentSteps: UsageStepRow[];
}
