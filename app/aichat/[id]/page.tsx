// page.tsx
import 'server-only';
import ChatComponent from '../components/Chat';
import { createServerSupabaseClient } from '@/lib/server/server';
import { format } from 'date-fns';
import { redirect } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import { cookies } from 'next/headers';
import { type Message } from '@ai-sdk/react';
import WebsiteWiever from '../components/WebsiteWiever';

interface ChatSource {
  sourceType: string;
  id: string;
  url: string;
}

interface SupabaseChatMessage {
  id: string;
  is_user_message: boolean;
  content: string | null;
  created_at: string;
  sources: unknown;
}

function parseSources(sources: unknown): ChatSource[] {
  if (!sources) return [];
  try {
    if (typeof sources === 'string') {
      return JSON.parse(sources) as ChatSource[];
    }
    if (Array.isArray(sources)) {
      return sources as ChatSource[];
    }
    return [];
  } catch (error) {
    console.error('Error parsing sources:', error);
    return [];
  }
}

function formatMessages(messages: SupabaseChatMessage[]): Message[] {
  return messages.map((message) => ({
    role: message.is_user_message ? 'user' : 'assistant',
    id: message.id,
    content: message.content ?? '',
    parts:
      parseSources(message.sources).length > 0
        ? [
            {
              type: 'text',
              text: message.content ?? ''
            },
            ...parseSources(message.sources).map((source) => ({
              type: 'source' as const,
              source: {
                sourceType: 'url' as const, // Fixed: explicitly set to 'url'
                id: source.id,
                url: source.url
              }
            }))
          ]
        : [
            {
              type: 'text',
              text: message.content ?? ''
            }
          ]
  }));
}
async function fetchChat(chatId: string) {
  noStore();
  const supabase = await createServerSupabaseClient();
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select(
        `
        id,
        user_id,
        created_at,
        updated_at,
        chat_messages!inner (
          id,
          is_user_message,
          content,
          created_at,
          sources
        )
      `
      )
      .eq('id', chatId)
      .order('created_at', {
        ascending: true,
        referencedTable: 'chat_messages'
      })
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching chat data from Supabase:', error);
    return null;
  }
}

export default async function ChatPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ url?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { id } = params;

  const chatData = await fetchChat(id);

  if (!chatData) {
    redirect('/aichat');
  }

  const cookieStore = await cookies();
  const modelType = cookieStore.get('modelType')?.value ?? 'standart';
  const selectedOption =
    cookieStore.get('selectedOption')?.value ?? 'gpt-3.5-turbo-1106';

  const formattedMessages = formatMessages(chatData.chat_messages);

  const formattedChatData = {
    id: chatData.id,
    user_id: chatData.user_id,
    prompt: formattedMessages
      .filter((m) => m.role === 'user')
      .map((m) => m.content),
    completion: formattedMessages
      .filter((m) => m.role === 'assistant')
      .map((m) => m.content),
    created_at: format(new Date(chatData.created_at), 'dd-MM-yyyy HH:mm'),
    updated_at: format(new Date(chatData.updated_at), 'dd-MM-yyyy HH:mm'),
    chat_messages: formattedMessages
  };

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        overflow: 'hidden'
      }}
    >
      <div style={{ flex: 1 }}>
        <ChatComponent
          currentChat={formattedChatData}
          chatId={id}
          initialModelType={modelType}
          initialSelectedOption={selectedOption}
        />
      </div>
      {searchParams.url ? (
        <WebsiteWiever url={decodeURIComponent(searchParams.url)} />
      ) : null}
    </div>
  );
}
