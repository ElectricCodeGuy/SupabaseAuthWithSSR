import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/server/server';

// Returns the breadcrumb title for a chat conversation: the stored chat_title,
// else the first user message (truncated), else a fallback. RLS scopes this to
// the requesting user's own chats.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from('chat_sessions')
    .select(
      'chat_title, message_parts(role, type, text_text, order, created_at)'
    )
    .eq('id', id)
    .maybeSingle();

  if (!data) {
    return NextResponse.json(
      { title: 'Chat' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const stored = data.chat_title?.trim();
  if (stored) {
    return NextResponse.json(
      { title: stored },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const firstUser = (data.message_parts ?? [])
    .filter((p) => p.role === 'user' && p.type === 'text' && p.text_text)
    .sort((a, b) =>
      a.created_at === b.created_at
        ? a.order - b.order
        : a.created_at < b.created_at
          ? -1
          : 1
    )[0];

  const title = firstUser?.text_text?.trim().slice(0, 70) || 'New chat';
  return NextResponse.json(
    { title },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
