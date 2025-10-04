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
          message_parts!inner (
            text_text,
            type,
            role,
            order
          )
        )
      `
    )
    .order('created_at', { referencedTable: 'chat_sessions', ascending: false })
    .order('created_at', { referencedTable: 'message_parts', ascending: true })
    .order('order', { referencedTable: 'message_parts', ascending: true })
    .range(offset, offset + limit - 1, { foreignTable: 'chat_sessions' })
    .limit(1, { foreignTable: 'message_parts' })
    .maybeSingle();

  if (queryError) {
    console.error('Supabase Query Error:', queryError.message);
    throw queryError;
  }

  if (!data) {
    console.warn('No user data found');
    return { userInfo: null, chatSessions: [] };
  }

  const userInfo: UserInfo = {
    id: data.id,
    full_name: data.full_name,
    email: data.email
  };

  const chatSessions: ChatSessionPreview[] = data.chat_sessions.map(
    (session) => {
      // Get the first text part from the first user message
      const firstTextPart = session.message_parts?.find(
        (part) => part.type === 'text' && part.role === 'user'
      );

      return {
        id: session.id,
        firstMessage:
          session.chat_title || firstTextPart?.text_text || 'No messages yet',
        created_at: session.created_at
      };
    }
  );

  return { userInfo, chatSessions };
}
