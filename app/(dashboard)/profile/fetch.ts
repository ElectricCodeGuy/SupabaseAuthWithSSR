import 'server-only';

// All server fetching for /profile — one round-trip of REAL account data.
import { createServerSupabaseClient } from '@/lib/server/server';
import {
  fetchUsageSteps,
  fetchModelPricing,
  summarizeUsage
} from '@/lib/server/usage';

export async function fetchProfileData(userId: string) {
  const supabase = await createServerSupabaseClient();

  const [
    { data: user },
    { data: authData },
    { count: chatCount },
    { count: documentCount },
    { data: memories, count: memoryCount },
    { data: recentChats },
    { data: recentDocuments },
    usageRows,
    pricing
  ] = await Promise.all([
    supabase
      .from('users')
      .select('full_name, email, is_admin, selected_model')
      .eq('id', userId)
      .maybeSingle(),
    supabase.auth.getUser(),
    supabase
      .from('chat_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('user_documents')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('user_memories')
      .select('id, content', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(4),
    supabase
      .from('chat_sessions')
      .select('id, chat_title, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(6),
    supabase
      .from('user_documents')
      .select('id, title, ai_title, total_pages, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),
    fetchUsageSteps(supabase, { userId, sinceDays: 30, limit: 4000 }),
    fetchModelPricing(supabase)
  ]);

  if (!user) return null;

  return {
    user,
    createdAt: authData.user?.created_at ?? null,
    chatCount: chatCount ?? 0,
    documentCount: documentCount ?? 0,
    memoryCount: memoryCount ?? 0,
    memories: memories ?? [],
    recentChats: recentChats ?? [],
    recentDocuments: recentDocuments ?? [],
    usage: summarizeUsage(usageRows, pricing, { recentLimit: 0 }).totals
  };
}
