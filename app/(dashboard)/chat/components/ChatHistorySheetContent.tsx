'use client';

import { type FC, useState } from 'react';
import {
  fetchChatPreviews,
  deleteChatData,
  updateChatTitle,
  type ChatPreview,
  type CategorizedChats,
  type FetchChatPreviewsResponse
} from '../actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/components/ui/hover-card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  MoreHorizontal,
  Edit as EditIcon,
  Trash as DeleteIcon,
  Loader2,
  FilePlus
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import useSWRInfinite from 'swr/infinite';

const PAGE_SIZE = 30;

const ChatHistorySheetContent: FC<{ onClose: () => void }> = ({ onClose }) => {
  const params = useParams();
  const router = useRouter();
  const currentChatId = typeof params.id === 'string' ? params.id : undefined;

  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const getKey = (
    pageIndex: number,
    previousPageData: FetchChatPreviewsResponse | null
  ) => {
    if (previousPageData && previousPageData.chatPreviews?.length === 0)
      return null;
    return ['chatPreviews', pageIndex];
  };

  const { data, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite(
      getKey,
      async ([, pageIndex]: [string, number]) => {
        const offset = pageIndex * PAGE_SIZE;
        return fetchChatPreviews(offset, PAGE_SIZE);
      },
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false
      }
    );

  // Merge all chat previews from all pages
  const allChatPreviews =
    data?.flatMap((page) => page?.chatPreviews || []) || [];
  const hasMore = data?.[data.length - 1]?.chatPreviews?.length === PAGE_SIZE;

  // Merge categorized chats from all pages
  const categorizedChats = data?.reduce<CategorizedChats>(
    (acc, page) => {
      if (!page?.categorizedChats) return acc;
      return {
        today: [...acc.today, ...page.categorizedChats.today],
        yesterday: [...acc.yesterday, ...page.categorizedChats.yesterday],
        last7Days: [...acc.last7Days, ...page.categorizedChats.last7Days],
        last30Days: [...acc.last30Days, ...page.categorizedChats.last30Days],
        last2Months: [...acc.last2Months, ...page.categorizedChats.last2Months],
        older: [...acc.older, ...page.categorizedChats.older]
      };
    },
    {
      today: [],
      yesterday: [],
      last7Days: [],
      last30Days: [],
      last2Months: [],
      older: []
    }
  ) || {
    today: [],
    yesterday: [],
    last7Days: [],
    last30Days: [],
    last2Months: [],
    older: []
  };

  const handleDeleteClick = (id: string) => {
    setChatToDelete(id);
    setDeleteConfirmationOpen(true);
  };

  const handleDeleteConfirmation = async () => {
    if (chatToDelete) {
      setIsDeleting(true);
      try {
        await deleteChatData(chatToDelete);
        // Remove deleted chat from local state
        mutate();
        if (chatToDelete === currentChatId) {
          router.push('/chat');
        }
      } catch (error) {
        console.error('Failed to delete:', error);
      } finally {
        setIsDeleting(false);
      }
    }
    setDeleteConfirmationOpen(false);
    setChatToDelete(null);
  };

  const handleOpenRename = (chatId: string) => {
    setEditingChatId(chatId);
    const chat = allChatPreviews.find((c) => c.id === chatId);
    setNewTitle(chat?.firstMessage || '');
    setEditDialogOpen(true);
  };

  const handleUpdateTitle = async () => {
    if (!editingChatId || !newTitle.trim()) return;

    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append('title', newTitle.trim());
      formData.append('chatId', editingChatId);
      await updateChatTitle(formData);
      mutate();
    } catch (error) {
      console.error('Failed to update title:', error);
    } finally {
      setIsUpdating(false);
      setEditDialogOpen(false);
      setEditingChatId(null);
      setNewTitle('');
    }
  };

  const renderChatSection = (title: string, chats: ChatPreview[]) => {
    if (!chats?.length) return null;

    return (
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-muted-foreground px-3 py-2 uppercase tracking-wider">
          {title}
        </h3>
        <div className="space-y-1">
          {chats.map(({ id, firstMessage }) => {
            const href = `/chat/${id}`;

            return (
              <div
                key={id}
                className={`group flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent cursor-pointer ${
                  currentChatId === id ? 'bg-accent' : ''
                }`}
              >
                <Link
                  href={href}
                  prefetch={false}
                  onClick={onClose}
                  className="flex-1 min-w-0"
                >
                  <HoverCard openDelay={500} closeDelay={200}>
                    <HoverCardTrigger asChild>
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm">{firstMessage}</span>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent
                      side="right"
                      align="start"
                      className="max-w-[400px] p-3"
                      sideOffset={10}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {firstMessage}
                      </p>
                    </HoverCardContent>
                  </HoverCard>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="rounded-lg">
                    <DropdownMenuItem onClick={() => handleOpenRename(id)}>
                      <EditIcon size={14} className="mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(id)}
                      className="text-destructive"
                    >
                      <DeleteIcon size={14} className="mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderChatHistoryGroups = () => {
    if (!allChatPreviews.length) {
      return (
        <div className="flex flex-col items-center justify-center p-4 h-[60vh] text-center">
          <h6 className="text-lg font-medium mb-2">No chat history yet</h6>
          <p className="text-sm text-muted-foreground">
            Start a new chat to begin building your chat history!
          </p>
        </div>
      );
    }

    return (
      <>
        {renderChatSection('Today', categorizedChats.today)}
        {renderChatSection('Yesterday', categorizedChats.yesterday)}
        {renderChatSection('Last 7 days', categorizedChats.last7Days)}
        {renderChatSection('Last 30 days', categorizedChats.last30Days)}
        {renderChatSection('Last 2 months', categorizedChats.last2Months)}
        {renderChatSection('Older', categorizedChats.older)}
      </>
    );
  };

  const renderSkeleton = () => (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="w-full h-10" />
        ))}
      </div>
    </div>
  );

  return (
    <>
      <SheetHeader className="p-4 border-b">
        <SheetTitle className="flex items-center justify-between">
          <span>Chat History</span>
        </SheetTitle>
        <div className="flex items-center gap-2 mt-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/chat" onClick={onClose}>
              <FilePlus size={14} className="mr-1" />
              New Chat
            </Link>
          </Button>
        </div>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? renderSkeleton() : renderChatHistoryGroups()}
        {hasMore && (
          <div className="p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
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
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmationOpen}
        onOpenChange={setDeleteConfirmationOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete chat?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              chat and all its messages.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmationOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirmation}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Title Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
            <DialogDescription>
              Enter a new title for this chat.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Chat title"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleUpdateTitle();
              }
            }}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setEditingChatId(null);
                setNewTitle('');
              }}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTitle}
              disabled={isUpdating || !newTitle.trim()}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatHistorySheetContent;
