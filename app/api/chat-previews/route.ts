import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/server/supabase';
import { createServerSupabaseClient } from '@/lib/server/server';
import { isToday, isYesterday, subDays } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import type {
  ChatPreview,
  CategorizedChats
} from '@/app/(dashboard)/chat/chat-previews';

const NO_STORE = { 'Cache-Control': 'no-store' };

const EMPTY_CATEGORIES: CategorizedChats = {
  today: [],
  yesterday: [],
  last7Days: [],
  last30Days: [],
  last2Months: [],
  older: []
};

function categorizeChats(chatPreviews: ChatPreview[]): CategorizedChats {
  const getZonedDate = (date: string) =>
    new TZDate(new Date(date), 'Europe/Copenhagen');

  const today = chatPreviews.filter((chat) =>
    isToday(getZonedDate(chat.created_at))
  );

  const yesterday = chatPreviews.filter((chat) =>
    isYesterday(getZonedDate(chat.created_at))
  );

  const last7Days = chatPreviews.filter((chat) => {
    const chatDate = getZonedDate(chat.created_at);
    const sevenDaysAgo = subDays(new Date(), 7);
    return (
      chatDate > sevenDaysAgo && !isToday(chatDate) && !isYesterday(chatDate)
    );
  });

  const last30Days = chatPreviews.filter((chat) => {
    const chatDate = getZonedDate(chat.created_at);
    const thirtyDaysAgo = subDays(new Date(), 30);
    const sevenDaysAgo = subDays(new Date(), 7);
    return chatDate > thirtyDaysAgo && chatDate <= sevenDaysAgo;
  });

  const last2Months = chatPreviews.filter((chat) => {
    const chatDate = getZonedDate(chat.created_at);
    const sixtyDaysAgo = subDays(new Date(), 60);
    const thirtyDaysAgo = subDays(new Date(), 30);
    return chatDate > sixtyDaysAgo && chatDate <= thirtyDaysAgo;
  });

  const older = chatPreviews.filter((chat) => {
    const sixtyDaysAgo = subDays(new Date(), 60);
    return getZonedDate(chat.created_at) <= sixtyDaysAgo;
  });

  return { today, yesterday, last7Days, last30Days, last2Months, older };
}

// Returns the current user's chats already sorted, grouped by date, and with
// favorites split out — ready for the sidebar to render directly.
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: NO_STORE }
    );
  }

  const { searchParams } = new URL(req.url);
  const offset = Number(searchParams.get('offset') ?? 0) || 0;
  const limit = Number(searchParams.get('limit') ?? 30) || 30;

  const supabase = await createServerSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select(
        `
          id,
          created_at,
          chat_title,
          is_favorite,
          is_public,
          message_parts:message_parts!chat_session_id (
            text_text,
            type,
            role,
            order
          )
        `
      )
      .order('created_at', { ascending: false })
      .order('created_at', {
        ascending: true,
        referencedTable: 'message_parts'
      })
      .order('order', {
        ascending: true,
        referencedTable: 'message_parts'
      })
      .limit(1, { foreignTable: 'message_parts' })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const chatPreviews: ChatPreview[] = data.map((sess) => {
      const firstTextPart = sess.message_parts?.find(
        (part) => part.type === 'text' && part.role === 'user'
      );

      return {
        id: sess.id,
        firstMessage:
          sess.chat_title ||
          firstTextPart?.text_text?.substring(0, 100) ||
          'No messages yet',
        created_at: sess.created_at,
        is_favorite: sess.is_favorite,
        is_public: sess.is_public
      };
    });

    return NextResponse.json(
      {
        chatPreviews,
        favorites: chatPreviews.filter((c) => c.is_favorite),
        categorizedChats: categorizeChats(chatPreviews)
      },
      { headers: NO_STORE }
    );
  } catch (error) {
    console.error('Error fetching chat previews:', error);
    return NextResponse.json(
      { chatPreviews: [], favorites: [], categorizedChats: EMPTY_CATEGORIES },
      { headers: NO_STORE }
    );
  }
}
