'use client';

import { type FC } from 'react';
import Link from '@/components/link';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import type {
  ChatPreview,
  FetchChatPreviewsResponse
} from '@/app/(dashboard)/chat/chat-previews';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  useSidebar
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Star } from 'lucide-react';
import ChatActionsMenu from '@/app/(dashboard)/chat/components/chat-history/ChatActionsMenu';

const PREVIEW_LIMIT = 50;

// Returns null on a non-OK response (e.g. 401 when the user is not signed in)
// so the component can show a "not signed in" fallback instead of crashing.
const fetcher = async (
  url: string
): Promise<FetchChatPreviewsResponse | null> => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

export const NavChats: FC = () => {
  const params = useParams();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const currentChatId = typeof params.id === 'string' ? params.id : undefined;

  // The route returns the chats already sorted, grouped by date, and with
  // favorites split out — so the client just renders them.
  const { data, isLoading, mutate } = useSWR(
    `/api/chat-previews?limit=${PREVIEW_LIMIT}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const favorites = data?.favorites ?? [];
  const categorized = data?.categorizedChats;
  // `data` is null when the user is not signed in (the route returns 401).
  const signedOut = !isLoading && !data;
  const isEmpty = !data?.chatPreviews || data.chatPreviews.length === 0;

  const handleSelect = () => {
    if (isMobile) setOpenMobile(false);
  };

  const handleDeleted = (id: string) => {
    mutate();
    if (id === currentChatId) router.push('/chat');
  };

  const renderItem = (chat: ChatPreview) => {
    const isActive = currentChatId === chat.id;
    return (
      <SidebarMenuItem key={chat.id}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={chat.firstMessage}
        >
          <Link href={`/chat/${chat.id}`} onClick={handleSelect}>
            {chat.is_favorite && (
              <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
            )}
            <span className="truncate">{chat.firstMessage}</span>
          </Link>
        </SidebarMenuButton>
        <ChatActionsMenu
          chatId={chat.id}
          title={chat.firstMessage}
          isFavorite={chat.is_favorite}
          isPublic={chat.is_public}
          onChanged={() => mutate()}
          onDeleted={() => handleDeleted(chat.id)}
          trigger={
            <SidebarMenuAction showOnHover aria-label="Chat actions">
              <MoreHorizontal />
            </SidebarMenuAction>
          }
        />
      </SidebarMenuItem>
    );
  };

  const renderSection = (label: string, chats: ChatPreview[]) => {
    if (chats.length === 0) return null;
    return (
      <SidebarGroup key={label}>
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>{chats.map(renderItem)}</SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <>
      {/* Favorites + chat history — text-only items, so hide the whole thing
          when the sidebar is collapsed to icons. */}
      <div className="group-data-[collapsible=icon]:hidden">
        {isLoading ? (
          <SidebarGroup>
            <SidebarGroupLabel>Chats</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuSkeleton />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : signedOut ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="flex flex-col items-start gap-2 px-2 py-3">
                <p className="text-sm font-medium">You&apos;re not signed in</p>
                <p className="text-xs text-muted-foreground">
                  Sign in to chat and keep your conversation history.
                </p>
                <Button asChild size="sm" className="mt-1 w-full">
                  <Link href="/login">Sign in</Link>
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  This is the open-source template powering{' '}
                  <Link
                    href="https://www.lovguiden.dk/"
                    target="_blank"
                    rel="noopener"
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Lovguiden
                  </Link>
                  , a Danish legal-AI platform that runs this exact RAG + chat
                  stack in production — search across legal documents, the law,
                  and case files with sources.
                </p>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : isEmpty ? (
          <SidebarGroup>
            <SidebarGroupLabel>Chats</SidebarGroupLabel>
            <SidebarGroupContent>
              <p className="px-2 py-1.5 text-xs text-muted-foreground">
                No chats yet. Start a new conversation.
              </p>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <>
            {favorites.length > 0 && renderSection('Favorites', favorites)}
            {categorized && (
              <>
                {renderSection('Today', categorized.today)}
                {renderSection('Yesterday', categorized.yesterday)}
                {renderSection('Last 7 days', categorized.last7Days)}
                {renderSection('Last 30 days', categorized.last30Days)}
                {renderSection('Last 2 months', categorized.last2Months)}
                {renderSection('Older', categorized.older)}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default NavChats;
