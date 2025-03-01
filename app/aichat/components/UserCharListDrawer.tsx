'use client';
import React, {
  type FC,
  useState,
  memo,
  useCallback,
  useMemo,
  useOptimistic,
  startTransition
} from 'react';
import {
  deleteChatData,
  fetchMoreChatPreviews,
  updateChatTitle
} from '../actions';
import { isToday, isYesterday, subDays } from 'date-fns';
import type { Tables } from '@/types/database';
import useSWRInfinite from 'swr/infinite';
import { TZDate } from '@date-fns/tz';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
// Shadcn UI components
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Import Drawer components from shadcn
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';

// Lucide icons (replacing MUI icons)
import {
  Trash as DeleteIcon,
  MoreHorizontal as MoreHorizIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  FilePlus as NoteAddIcon,
  Menu as MenuIcon
} from 'lucide-react';

type UserInfo = Pick<Tables<'users'>, 'full_name' | 'email' | 'id'>;

interface ChatPreview {
  id: string;
  firstMessage: string;
  created_at: string;
}

interface CombinedDrawerProps {
  userInfo: UserInfo;
  initialChatPreviews: ChatPreview[];
}

const useCategorizedChats = (chatPreviews: ChatPreview[][] | undefined) => {
  return useMemo(() => {
    const chatPreviewsFlat = chatPreviews ? chatPreviews.flat() : [];
    const getZonedDate = (date: string) =>
      new TZDate(new Date(date), 'Europe/Copenhagen');

    const today = chatPreviewsFlat.filter((chat) =>
      isToday(getZonedDate(chat.created_at))
    );

    const yesterday = chatPreviewsFlat.filter((chat) =>
      isYesterday(getZonedDate(chat.created_at))
    );

    const last7Days = chatPreviewsFlat.filter((chat) => {
      const chatDate = getZonedDate(chat.created_at);
      const sevenDaysAgo = subDays(new Date(), 7);
      return (
        chatDate > sevenDaysAgo && !isToday(chatDate) && !isYesterday(chatDate)
      );
    });

    const last30Days = chatPreviewsFlat.filter((chat) => {
      const chatDate = getZonedDate(chat.created_at);
      const thirtyDaysAgo = subDays(new Date(), 30);
      const sevenDaysAgo = subDays(new Date(), 7);
      return chatDate > thirtyDaysAgo && chatDate <= sevenDaysAgo;
    });

    const last2Months = chatPreviewsFlat.filter((chat) => {
      const chatDate = getZonedDate(chat.created_at);
      const sixtyDaysAgo = subDays(new Date(), 60);
      const thirtyDaysAgo = subDays(new Date(), 30);
      return chatDate > sixtyDaysAgo && chatDate <= thirtyDaysAgo;
    });

    const older = chatPreviewsFlat.filter((chat) => {
      const sixtyDaysAgo = subDays(new Date(), 60);
      return getZonedDate(chat.created_at) <= sixtyDaysAgo;
    });

    return { today, yesterday, last7Days, last30Days, last2Months, older };
  }, [chatPreviews]);
};

// Content component to avoid duplication between mobile and desktop
interface DrawerContentProps {
  userInfo: UserInfo;
  chatPreviews: ChatPreview[][] | undefined;
  currentChatId: string | undefined;
  categorizedChats: ReturnType<typeof useCategorizedChats>;
  handleDeleteClick: (id: string) => void;
  handleChatSelect: (id: string) => void;
  loadMoreChats: () => Promise<void>;
  isLoadingMore: boolean;
  hasMore: boolean;
}

const ChatListComponent: FC<DrawerContentProps> = ({
  userInfo,
  chatPreviews,
  currentChatId,
  categorizedChats,
  handleDeleteClick,
  handleChatSelect,
  loadMoreChats,
  isLoadingMore,
  hasMore
}) => {
  return (
    <div className="flex flex-col h-full">
      {!userInfo.email ? (
        // Show sign-in message when no user
        <div className="flex flex-col items-center justify-center h-[90vh] text-center p-4 space-y-4">
          <h3 className="text-lg font-medium">
            Sign in to save and view your chats
          </h3>

          <Button asChild className="rounded-lg px-8 py-2 font-normal">
            <Link href="/signin">Sign in</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-end w-full pt-2 pr-2 gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary h-8 w-8"
                    asChild
                  >
                    <Link href="/aichat" aria-label="clear messages">
                      <NoteAddIcon className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Create a new conversation</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="overflow-auto flex-1">
            {!chatPreviews ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="px-2 py-1">
                  <Skeleton className="h-6 w-full" />
                </div>
              ))
            ) : (
              <>
                <RenderChatSection
                  title="Today"
                  chats={categorizedChats.today}
                  currentChatId={currentChatId}
                  handleDeleteClick={handleDeleteClick}
                  onChatSelect={handleChatSelect}
                />
                <RenderChatSection
                  title="Yesterday"
                  chats={categorizedChats.yesterday}
                  currentChatId={currentChatId}
                  handleDeleteClick={handleDeleteClick}
                  onChatSelect={handleChatSelect}
                />
                <RenderChatSection
                  title="Last 7 days"
                  chats={categorizedChats.last7Days}
                  currentChatId={currentChatId}
                  handleDeleteClick={handleDeleteClick}
                  onChatSelect={handleChatSelect}
                />
                <RenderChatSection
                  title="Last 30 days"
                  chats={categorizedChats.last30Days}
                  currentChatId={currentChatId}
                  handleDeleteClick={handleDeleteClick}
                  onChatSelect={handleChatSelect}
                />
                <RenderChatSection
                  title="Last 2 month"
                  chats={categorizedChats.last2Months}
                  currentChatId={currentChatId}
                  handleDeleteClick={handleDeleteClick}
                  onChatSelect={handleChatSelect}
                />
                <RenderChatSection
                  title="Older"
                  chats={categorizedChats.older}
                  currentChatId={currentChatId}
                  handleDeleteClick={handleDeleteClick}
                  onChatSelect={handleChatSelect}
                />
                {hasMore && (
                  <div className="flex justify-center my-4">
                    <Button
                      variant="outline"
                      onClick={loadMoreChats}
                      disabled={isLoadingMore}
                      className="rounded-lg min-w-[120px]"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="animate-spin mr-2 h-4 w-4" />
                          Load more
                        </>
                      ) : (
                        'Load more'
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const CombinedDrawer: FC<CombinedDrawerProps> = ({
  userInfo,
  initialChatPreviews
}) => {
  const params = useParams();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const currentChatId = typeof params.id === 'string' ? params.id : undefined;

  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const {
    data: chatPreviews,
    mutate: mutateChatPreviews,
    isValidating: isLoadingMore,
    size,
    setSize
  } = useSWRInfinite(
    (index) => [`chatPreviews`, index],
    async ([_, index]) => {
      const offset = index * 25;
      const newChatPreviews = await fetchMoreChatPreviews(offset);
      return newChatPreviews;
    },
    {
      fallbackData: [initialChatPreviews],
      revalidateFirstPage: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      revalidateOnMount: false
    }
  );

  const hasMore =
    chatPreviews && chatPreviews[chatPreviews.length - 1]?.length === 30;

  const loadMoreChats = useCallback(async () => {
    if (!isLoadingMore) {
      await setSize(size + 1);
    }
  }, [isLoadingMore, setSize, size]);

  const handleDeleteClick = (id: string) => {
    setChatToDelete(id);
    setDeleteConfirmationOpen(true);
  };

  const handleDeleteConfirmation = async () => {
    if (chatToDelete) {
      try {
        await deleteChatData(chatToDelete);
        await mutateChatPreviews();

        // If the deleted chat is the current one, redirect to /aichat
        if (chatToDelete === currentChatId) {
          router.push('/aichat');
        }
      } catch (error) {
        console.error('Failed to delete the chat:', error);
      }
    }
    setDeleteConfirmationOpen(false);
    setChatToDelete(null);
  };

  const categorizedChats = useCategorizedChats(chatPreviews);

  const handleChatSelect = useCallback(() => {
    // Close drawer on mobile screens
    if (window.innerWidth < 800) {
      setIsMobileOpen(false);
    }
  }, []);

  return (
    <>
      {/* Mobile drawer */}
      <div className="md:hidden">
        <Drawer open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <DrawerTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed left-1 bottom-10 z-50 bg-white/80 shadow-sm"
            >
              <MenuIcon className="h-5 w-5 text-blue-600" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-[85vh]">
            <div className="h-full p-0 bg-[rgba(240,247,255,0.9)]">
              <ChatListComponent
                userInfo={userInfo}
                chatPreviews={chatPreviews}
                currentChatId={currentChatId}
                categorizedChats={categorizedChats}
                handleDeleteClick={handleDeleteClick}
                handleChatSelect={handleChatSelect}
                loadMoreChats={loadMoreChats}
                isLoadingMore={isLoadingMore}
                hasMore={hasMore ?? false}
              />
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Desktop persistent drawer */}
      <div className="hidden md:block fixed inset-y-0 left-0 z-20 w-[200px] lg:w-[250px] xl:w-[300px] 2xl:w-[350px] bg-[rgba(240,247,255,0.9)] border-r border-[rgba(0,0,0,0.1)]">
        <ChatListComponent
          userInfo={userInfo}
          chatPreviews={chatPreviews}
          currentChatId={currentChatId}
          categorizedChats={categorizedChats}
          handleDeleteClick={handleDeleteClick}
          handleChatSelect={handleChatSelect}
          loadMoreChats={loadMoreChats}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore ?? false}
        />
      </div>

      {/* Main content area - add padding to account for the drawer */}
      <div className="md:pl-[200px] lg:pl-[250px] xl:pl-[300px] 2xl:pl-[350px]">
        {/* Your main content goes here */}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteConfirmationOpen}
        onOpenChange={setDeleteConfirmationOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Confirmation</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to delete this chat?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmationOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirmation}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

interface RenderChatSectionProps {
  title: string;
  chats: ChatPreview[];
  currentChatId: string | null | undefined;
  handleDeleteClick: (id: string) => void;
  onChatSelect: (id: string) => void;
}

const RenderChatSection: FC<RenderChatSectionProps> = memo(
  ({ title, chats, currentChatId, handleDeleteClick, onChatSelect }) => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [menuChatId, setMenuChatId] = useState<string | null>(null);
    const [editingChatId, setEditingChatId] = useState<string | null>(null);
    const [newTitle, setNewTitle] = useState('');

    const [optimisticChats, addOptimisticChat] = useOptimistic(
      chats,
      (
        currentChats: ChatPreview[],
        optimisticUpdate: { id: string; newTitle: string }
      ) =>
        currentChats.map((chat) =>
          chat.id === optimisticUpdate.id
            ? {
                ...chat,
                firstMessage: optimisticUpdate.newTitle
              }
            : chat
        )
    );

    const handleMenuClick = (
      event: React.MouseEvent<HTMLElement>,
      chatId: string
    ) => {
      event.preventDefault();
      event.stopPropagation();
      setMenuChatId(chatId);
      setMenuOpen(true);
    };

    const handleMenuClose = () => {
      setMenuOpen(false);
      setMenuChatId(null);
    };

    const handleOpenRename = (chatId: string) => {
      setEditingChatId(chatId);
      setEditDialogOpen(true);
      handleMenuClose();
    };

    const handleCloseDialog = () => {
      setEditDialogOpen(false);
      setEditingChatId(null);
      setNewTitle('');
    };

    if (optimisticChats.length === 0) return null;

    return (
      <>
        <div className="px-3 mb-2">
          <div className="relative flex items-center py-2">
            <Separator>
              <span className="flex-shrink mx-2 text-xs text-gray-500">
                {title}
              </span>
            </Separator>
          </div>
        </div>

        {optimisticChats.map(({ id, firstMessage }) => {
          const currentParams = new URLSearchParams(searchParams.toString());
          const href = `/aichat/${id}${
            currentParams.toString() ? '?' + currentParams.toString() : ''
          }`;

          return (
            <div key={id} className="relative">
              <Link
                href={href}
                prefetch={false}
                scroll={false}
                className={cn(
                  'block px-3 py-2 text-sm relative pr-8',
                  'hover:bg-gray-100/70 transition-colors',
                  currentChatId === id ? 'bg-gray-200/70' : '',
                  'group'
                )}
                onMouseEnter={() => router.prefetch(href)}
                onClick={() => onChatSelect(id)}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                        {firstMessage}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="right">{firstMessage}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <DropdownMenu
                  open={menuOpen && menuChatId === id}
                  onOpenChange={handleMenuClose}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'absolute right-1 top-1/2 -translate-y-1/2',
                        'opacity-0 group-hover:opacity-100',
                        currentChatId === id ? 'opacity-100' : '',
                        'h-6 w-6 p-0'
                      )}
                      onClick={(e) => handleMenuClick(e, id)}
                    >
                      <MoreHorizIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      disabled
                      className="flex items-center gap-2"
                    >
                      <ShareIcon className="h-4 w-4" />
                      <span>Share</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleOpenRename(id)}
                      className="flex items-center gap-2"
                    >
                      <EditIcon className="h-4 w-4" />
                      <span>Rename</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        handleDeleteClick(id);
                        handleMenuClose();
                      }}
                      className="text-red-600 flex items-center gap-2"
                    >
                      <DeleteIcon className="h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Link>
            </div>
          );
        })}

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Rename Chat</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const chatId = formData.get('chatId') as string;
                const title = formData.get('title') as string;

                startTransition(async () => {
                  // Apply optimistic update immediately
                  addOptimisticChat({
                    id: chatId,
                    newTitle: title
                  });
                  await updateChatTitle(formData);
                });

                handleCloseDialog();
              }}
              className="space-y-4"
            >
              <input type="hidden" name="chatId" value={editingChatId ?? ''} />
              <div>
                <Input
                  name="title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter new name"
                  required
                  className="w-full"
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleCloseDialog}
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.title === nextProps.title &&
      prevProps.currentChatId === nextProps.currentChatId &&
      prevProps.chats.length === nextProps.chats.length &&
      prevProps.chats.every((chat, index) => {
        const nextChat = nextProps.chats[index];
        return (
          chat.id === nextChat.id && chat.firstMessage === nextChat.firstMessage
        );
      })
    );
  }
);

RenderChatSection.displayName = 'RenderChatSection';

export default CombinedDrawer;
