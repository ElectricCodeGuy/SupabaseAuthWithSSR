import { unstable_noStore as noStore } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/server/server';
import type { Tables } from '@/types/database';

type UserInfo = Pick<Tables<'users'>, 'full_name' | 'email' | 'id'>;

interface ChatSessionPreview {
  id: string;
  firstMessage: string;
  created_at: string;
}

interface UserDataWithSessions {
  userInfo: UserInfo | null;
  chatSessions: ChatSessionPreview[];
}

export type FetchedUserDataAndSessions = ReturnType<
  typeof fetchUserDataAndChatSessions
>;

export async function fetchUserDataAndChatSessions(
  limit = 30,
  offset = 0
): Promise<UserDataWithSessions> {
  noStore();

  const supabase = await createServerSupabaseClient();

  const { data, error: queryError } = await supabase
    .from('users')
    .select(
      `
        id,
        full_name,
        email,
        chat_sessions (
                  id,
          created_at,
          chat_title,
          first_message:chat_messages!inner(content)
        )
      `
    )
    .order('created_at', { referencedTable: 'chat_sessions', ascending: false })
    .range(offset, offset + limit - 1, { foreignTable: 'chat_sessions' })
    .maybeSingle();

  if (queryError) {
    // Error occurred during the query, re-throw it
    console.error('Supabase Query Error:', queryError.message); // Keep minimal log?
    throw queryError;
  }
  if (!data) {
    // No data found, return null
    console.warn('No user data found');
    return { userInfo: null, chatSessions: [] };
  }

  const userInfo: UserInfo = {
    id: data.id,
    full_name: data.full_name,
    email: data.email
  };

  const chatSessions: ChatSessionPreview[] = (data.chat_sessions || []).map(
    (session) => ({
      id: session.id,
      firstMessage:
        session.chat_title ??
        session.first_message?.[0]?.content ??
        'No messages yet',
      created_at: session.created_at
    })
  );

  return { userInfo, chatSessions };
}
