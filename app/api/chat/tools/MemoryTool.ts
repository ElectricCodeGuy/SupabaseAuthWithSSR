// Long-term memory tool. Memories are discrete rows in user_memories — the
// chat API injects all of a user's memories into the (uncached) dynamic
// system block on every request, and this tool lets the model save, list and
// delete them when the user explicitly asks.
import 'server-only';
import { tool } from 'ai';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/server/server';

// The whole memory set rides along in every prompt, so keep it bounded.
const MAX_MEMORIES = 50;
const MAX_MEMORY_CHARS = 500;

export interface UserMemory {
  id: string;
  content: string;
  created_at: string;
}

// Fetch all memories for prompt injection (used by the chat route).
export async function fetchUserMemories(userId: string): Promise<UserMemory[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('user_memories')
    .select('id, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(MAX_MEMORIES);

  if (error) {
    console.error('Error fetching user memories:', error);
    return [];
  }
  return data ?? [];
}

// Render memories as a system-prompt block. Returns '' when there are none.
export function formatMemoriesForPrompt(memories: UserMemory[]): string {
  if (memories.length === 0) return '';
  return `<userMemories>
Facts the user has explicitly asked you to remember in past conversations. Each memory has an id you can pass to the saveMemory tool to delete it.

${memories.map((m) => `- [id: ${m.id}] ${m.content}`).join('\n')}

Use these to tailor your answers when relevant, but do NOT bring them up unprompted or say things like "as I remember about you".
</userMemories>`;
}

export const saveMemory = ({ userId }: { userId: string }) =>
  tool({
    description: `Manage the user's long-term memories (facts remembered across all conversations).

ONLY call this when the user EXPLICITLY asks you to remember, forget, or list what you remember — e.g. "remember that I prefer short answers", "forget that I work at Acme", "what do you remember about me?". NEVER save information the user merely mentioned in passing.

Actions:
- "save": store a new memory. Phrase it as a short third-person fact ("The user prefers TypeScript over JavaScript").
- "list": return all stored memories with their ids.
- "delete": remove one memory by its id (ids are shown in <userMemories> and by "list").`,
    inputSchema: z.object({
      action: z.enum(['save', 'list', 'delete']).describe('Operation to perform'),
      memory: z
        .string()
        .max(MAX_MEMORY_CHARS)
        .optional()
        .describe(
          'The fact to remember, as a short third-person sentence — required for action "save"'
        ),
      memoryId: z
        .string()
        .optional()
        .describe('Id of the memory to delete — required for action "delete"')
    }),
    execute: async ({ action, memory, memoryId }) => {
      const supabase = await createServerSupabaseClient();

      if (action === 'save') {
        const content = (memory ?? '').trim();
        if (!content) {
          return {
            success: false as const,
            action,
            message: 'No memory text provided.'
          };
        }

        const { count } = await supabase
          .from('user_memories')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId);
        if ((count ?? 0) >= MAX_MEMORIES) {
          return {
            success: false as const,
            action,
            message: `Memory limit reached (${MAX_MEMORIES}). Delete an old memory before saving a new one.`
          };
        }

        const { data, error } = await supabase
          .from('user_memories')
          .insert({ user_id: userId, content })
          .select('id, content, created_at')
          .single();
        if (error) {
          console.error('saveMemory insert error:', error);
          return {
            success: false as const,
            action,
            message: 'Could not save the memory.'
          };
        }
        return {
          success: true as const,
          action,
          memory: data,
          message: 'Memory saved.'
        };
      }

      if (action === 'delete') {
        if (!memoryId) {
          return {
            success: false as const,
            action,
            message: 'No memoryId provided.'
          };
        }
        const { error } = await supabase
          .from('user_memories')
          .delete()
          .eq('user_id', userId)
          .eq('id', memoryId);
        if (error) {
          console.error('saveMemory delete error:', error);
          return {
            success: false as const,
            action,
            message: 'Could not delete the memory.'
          };
        }
        return {
          success: true as const,
          action,
          deletedId: memoryId,
          message: 'Memory deleted.'
        };
      }

      // list
      const memories = await fetchUserMemories(userId);
      return {
        success: true as const,
        action,
        memories,
        message:
          memories.length === 0
            ? 'No memories stored yet.'
            : `${memories.length} memor${memories.length === 1 ? 'y' : 'ies'} stored.`
      };
    }
  });
