'use client';

import { type FC, useMemo, useState } from 'react';
import Link from '@/components/link';
import useSWRInfinite from 'swr/infinite';
import type {
  ChatPreview,
  FetchChatPreviewsResponse
} from '../chat-previews';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, MessageSquare, Search, Star } from 'lucide-react';
import ChatActionsMenu from '../components/chat-history/ChatActionsMenu';

const PAGE_SIZE = 30;

const SettingsConversations: FC = () => {
  const [query, setQuery] = useState('');

  const getKey = (
    pageIndex: number,
    previousPageData: FetchChatPreviewsResponse | null
  ) => {
    if (previousPageData && (previousPageData.chatPreviews?.length ?? 0) === 0)
      return null;
    return ['/api/chat-previews', pageIndex] as const;
  };

  const { data, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite(
      getKey,
      // Returns null on a non-OK response (e.g. 401 when not signed in).
      async ([, pageIndex]): Promise<FetchChatPreviewsResponse | null> => {
        const offset = pageIndex * PAGE_SIZE;
        const res = await fetch(
          `/api/chat-previews?offset=${offset}&limit=${PAGE_SIZE}`
        );
        if (!res.ok) return null;
        return res.json();
      },
      { revalidateOnFocus: false, revalidateOnReconnect: false }
    );

  const allChats = useMemo(
    () => data?.flatMap((page) => page?.chatPreviews ?? []) ?? [],
    [data]
  );
  // null first page means the user is not signed in (route returned 401).
  const signedOut = !isLoading && data?.[0] === null;
  const lastPage = data?.[data.length - 1];
  const hasMore = (lastPage?.chatPreviews?.length ?? 0) === PAGE_SIZE;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allChats;
    return allChats.filter((c) => c.firstMessage.toLowerCase().includes(q));
  }, [allChats, query]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Search, rename, share or delete your conversations.
      </p>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search conversations..."
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : signedOut ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Sign in to view and manage your conversations.
          </p>
          <Button asChild size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {query
              ? 'No conversations match your search.'
              : 'No conversations yet.'}
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {filtered.map((chat: ChatPreview) => (
            <li
              key={chat.id}
              className="group flex items-center gap-2 px-3 py-2.5 hover:bg-accent"
            >
              <Link
                href={`/chat/${chat.id}`}
                prefetch={false}
                className="flex min-w-0 flex-1 items-center gap-2"
              >
                {chat.is_favorite && (
                  <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
                )}
                <span className="truncate text-sm">{chat.firstMessage}</span>
              </Link>
              <ChatActionsMenu
                chatId={chat.id}
                title={chat.firstMessage}
                isFavorite={chat.is_favorite}
                isPublic={chat.is_public}
                onChanged={() => mutate()}
                onDeleted={() => mutate()}
              />
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="self-center"
          onClick={() => setSize(size + 1)}
          disabled={isValidating}
        >
          {isValidating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            'Load more'
          )}
        </Button>
      )}
    </div>
  );
};

export default SettingsConversations;
