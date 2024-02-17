import 'server-only';
import Chat from './components/chat';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/client/supabase';
import { fetchChatMessages, fetchChatMetadata } from './actions';

export const runtime = 'edge';

type MessageFromDB = {
  id: string;
  prompt: string;
  completion: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

export default async function ChatPage({
  searchParams
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const session = await getSession();

  if (!session) {
    redirect('/auth');
  }

  const chatId = searchParams['chatId'] ?? '';

  if (chatId === '') {
    return <Chat session={session} />;
  }

  const userId = session?.id || 'unknown-user';
  const chatKey = `chat:${chatId}-user:${userId}`;

  const [chatPrompts, chatCompletions, chatMetadataResult] = await Promise.all([
    fetchChatMessages(chatKey, 'prompts'),
    fetchChatMessages(chatKey, 'completions'),
    fetchChatMetadata(chatKey)
  ]);

  const { metadata: chatMetadata } = chatMetadataResult;

  const chatData: MessageFromDB = {
    id: chatId,
    prompt: JSON.stringify(chatPrompts),
    completion: JSON.stringify(chatCompletions),
    user_id: chatMetadata?.user_id ?? null,
    created_at: chatMetadata?.created_at ?? '',
    updated_at: chatMetadata?.updated_at ?? ''
  };

  return <Chat session={session} currentChat={chatData} />;
}
