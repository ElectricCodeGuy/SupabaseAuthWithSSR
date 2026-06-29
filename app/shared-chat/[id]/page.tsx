import 'server-only';
import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Bot, User } from 'lucide-react';
import { createAdminClient } from '@/lib/server/admin';
import { formatMessages } from '@/app/(dashboard)/chat/[id]/fetch';
import MemoizedMarkdown from '@/app/(dashboard)/chat/components/tools/MemoizedMarkdown';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Shared conversation',
  robots: { index: false, follow: false }
};

async function fetchPublicChat(id: string) {
  // Public viewers may not be logged in, so use the admin client and gate
  // strictly on is_public = true.
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('chat_sessions')
    .select(
      `
      id,
      chat_title,
      is_public,
      message_parts (*)
    `
    )
    .eq('id', id)
    .eq('is_public', true)
    .order('created_at', { ascending: true, referencedTable: 'message_parts' })
    .order('order', { ascending: true, referencedTable: 'message_parts' })
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export default async function SharedChatPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const chat = await fetchPublicChat(id);

  if (!chat) notFound();

  const messages = formatMessages(chat.message_parts);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <header className="mb-6 border-b pb-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Shared conversation
        </p>
        <h1 className="mt-1 text-2xl font-semibold">
          {chat.chat_title || 'Conversation'}
        </h1>
      </header>

      <ul className="space-y-4">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <li key={message.id}>
              <Card
                className={
                  isUser
                    ? 'border-primary/20 bg-primary/5'
                    : 'border-border/50 bg-card'
                }
              >
                <CardHeader className="px-4 pb-0">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full ${
                        isUser ? 'bg-primary' : 'bg-primary/10'
                      }`}
                    >
                      {isUser ? (
                        <User className="h-4 w-4 text-primary-foreground" />
                      ) : (
                        <Bot className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <span className="text-sm font-medium">
                      {isUser ? 'User' : 'AI Assistant'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="px-4 py-2">
                  {message.parts.map((part, i) =>
                    part.type === 'text' ? (
                      <MemoizedMarkdown
                        key={i}
                        content={part.text}
                        id={`${message.id}-${i}`}
                      />
                    ) : null
                  )}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
