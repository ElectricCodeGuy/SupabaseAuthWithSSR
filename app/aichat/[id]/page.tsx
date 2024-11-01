import 'server-only';
import { Box } from '@mui/material';
import ChatComponent from '../components/chat';
import UserCharListDrawer from '../components/UserCharListDrawer';
import { createServerSupabaseClient } from '@/lib/server/server';
import { format } from 'date-fns';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

async function fetchChat(supabase: SupabaseClient<Database>, chatId: string) {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select(
        `
        id,
        user_id,
        created_at,
        updated_at,
        chat_messages (
          id,
          is_user_message,
          content,
          created_at
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

async function fetchData(
  supabase: SupabaseClient<Database>,
  limit: number = 30,
  offset: number = 0
) {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select(
        `
          id,
          created_at,
          chat_messages (
            content
          )
        `
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return data.map((session) => ({
      id: session.id,
      firstMessage: session.chat_messages[0]?.content || 'No messages yet',
      created_at: session.created_at
    }));
  } catch (error) {
    console.error('Error fetching chat previews:', error);
    return [];
  }
}

export default async function ChatPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;

  let { id } = params;

  const supabase = await createServerSupabaseClient();

  id = id === '1' ? '' : id;

  const [chatPreviews, chatData] = await Promise.all([
    fetchData(supabase, 30, 0),
    id ? fetchChat(supabase, id) : Promise.resolve(null)
  ]);

  const formattedChatData = chatData
    ? {
        id: chatData.id,
        user_id: chatData.user_id, // Add this line
        prompt: chatData.chat_messages
          .filter((m) => m.is_user_message)
          .map((m) => m.content),
        completion: chatData.chat_messages
          .filter((m) => !m.is_user_message)
          .map((m) => m.content),
        created_at: format(new Date(chatData.created_at), 'dd-MM-yyyy HH:mm'),
        updated_at: format(new Date(chatData.updated_at), 'dd-MM-yyyy HH:mm'),
        chat_messages: chatData.chat_messages // Add this line
      }
    : null; // Change this to null instead of an empty object

  return (
    <Box
      sx={{
        display: 'flex',
        overflow: 'hidden',
        maxHeight: '100vh',
        pt: {
          xs: 4,
          sm: 4,
          md: 0
        }
      }}
    >
      <ChatComponent currentChat={formattedChatData} chatId={id} />
      <UserCharListDrawer chatPreviews={chatPreviews} chatId={id} />
    </Box>
  );
}
