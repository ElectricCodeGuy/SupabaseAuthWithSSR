import 'server-only';
import { createServerSupabaseClient } from '@/lib/server/server';

// Default model used when a user has not chosen one yet.
export const DEFAULT_MODEL_ID = 'gemini-3.1-pro-preview';

export type SelectableModel = {
  model_id: string;
  display_name: string;
  provider: string;
};

// All active models (model_id + provider) — used by the chat API route to
// resolve which provider to call for a given selected model_id.
export async function getModelConfig(): Promise<
  { model_id: string; provider: string }[]
> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('ai_models')
    .select('model_id, provider')
    .eq('active', true)
    .order('display_order', { ascending: true });
  return data ?? [];
}

// Models the user is allowed to pick in the chat model dropdown.
export async function getSelectableModels(): Promise<SelectableModel[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('ai_models')
    .select('model_id, display_name, provider')
    .eq('active', true)
    .eq('selectable', true)
    .order('display_order', { ascending: true });
  return data ?? [];
}

// The model picker data for the new-chat page, which has no chat to read the
// selection from (the [id] page gets the selection from fetchChat instead).
export async function getChatModelData(): Promise<{
  models: SelectableModel[];
  selectedModel: string;
}> {
  const [models, selectedModel] = await Promise.all([
    getSelectableModels(),
    getSelectedModelId()
  ]);
  return { models, selectedModel };
}

export type CatalogModel = {
  model_id: string;
  display_name: string;
  provider: string;
  description: string;
  source_url: string;
  cost_tier: string;
  cost_note: string;
  input_cost_per_million_usd: number;
  output_cost_per_million_usd: number;
  selectable: boolean;
};

// All active models with their full details — used by the AI Models settings tab.
export async function getCatalogModels(): Promise<CatalogModel[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('ai_models')
    .select(
      'model_id, display_name, provider, description, source_url, cost_tier, cost_note, input_cost_per_million_usd, output_cost_per_million_usd, selectable'
    )
    .eq('active', true)
    .order('display_order', { ascending: true });
  return data ?? [];
}

// The current user's chosen model_id (falls back to the default).
export async function getSelectedModelId(): Promise<string> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('users')
    .select('selected_model')
    .maybeSingle();
  return data?.selected_model ?? DEFAULT_MODEL_ID;
}
