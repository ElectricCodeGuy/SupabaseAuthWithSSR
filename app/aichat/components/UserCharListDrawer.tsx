'use client';
import React, {
  type FC,
  useState,
  memo,
  useCallback,
  useOptimistic,
  startTransition,
  useMemo
} from 'react';
import {
  deleteChatData,
  fetchMoreChatPreviews,
  deleteFilterTagAndDocumentChunks,
  updateChatTitle
} from '../actions';
import { format } from 'date-fns';
import type { Tables } from '@/types/database';
import useSWRInfinite from 'swr/infinite';
import Link from 'next/link';
import {
  useRouter,
  useParams,
  useSearchParams,
  usePathname
} from 'next/navigation';
import { useUpload } from '../context/uploadContext';
import ServerUploadPage from './FileUpload';
import { createClient } from '@/lib/client/client';
import { decodeBase64, encodeBase64 } from '../lib/base64';
import useSWRImmutable from 'swr/immutable';
import { useFormStatus } from 'react-dom';

// Lucide Icons
import {
  Loader2,
  Trash,
  MoreHorizontal,
  Share,
  Edit,
  FilePlus,
  Menu,
  FileText, // Added for file mode toggle
  MessageSquare // Added for chat mode toggle
} from 'lucide-react';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

type UserInfo = Pick<Tables<'users'>, 'full_name' | 'email' | 'id'>;

interface ChatPreview {
  id: string;
  firstMessage: string;
  created_at: string;
}

interface CategorizedChats {
  today: ChatPreview[];
  yesterday: ChatPreview[];
  last7Days: ChatPreview[];
  last30Days: ChatPreview[];
  last2Months: ChatPreview[];
  older: ChatPreview[];
}

interface CombinedDrawerProps {
  userInfo: UserInfo;
  initialChatPreviews: ChatPreview[];
  categorizedChats: CategorizedChats;
}

interface FileObject {
  name: string;
  created_at: string;
  updated_at: string;
}

const fetcher = async (userId: string) => {
  const supabase = createClient();
  const { data: files, error } = await supabase.rpc('list_objects', {
    bucketid: 'userfiles',
    prefix: `${userId}/`,
    limits: 1000,
    offsets: 0
  });

  if (error) {
    console.error('Error fetching user files:', error);
    return [];
  }

  return files.map((file) => ({
    ...file,
    name: decodeBase64(file.name.split('/').pop() ?? '')
  }));
};

const CombinedDrawer: FC<CombinedDrawerProps> = ({
  userInfo,
  initialChatPreviews,
  categorizedChats
}) => {
  // Add local state to manage active mode instead of using context
  const [activeMode, setActiveMode] = useState<'chat' | 'files'>('chat');
  const { selectedBlobs, setSelectedBlobs } = useUpload();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

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

        // If the deleted chat is the current one, redirect to /aichat while preserving pdf parameter
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

  const handleChatSelect = useCallback(() => {
    // Close drawer on mobile screens
    if (window.innerWidth < 800) {
      setIsOpen(false);
    }
  }, []);

  // Only fetch user files when in files mode
  const {
    data: userFiles = [],
    isLoading: isLoadingFiles,
    mutate: mutateFiles
  } = useSWRImmutable<FileObject[]>(
    activeMode === 'files' && userInfo.id ? `userFiles` : null,
    () => fetcher(userInfo.id)
  );

  const sortedUserFiles = useMemo(() => {
    return [...userFiles].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [userFiles]);

  // Desktop sidebar content
  const SidebarContent = (
    <div className="flex flex-col h-full">
      {!userInfo.email ? (
        // Sign-in prompt when no user
        <div className="flex flex-col items-center justify-center h-[90vh] text-center p-4 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Sign in to save and view your chats
          </h3>
          <Button asChild className="rounded-md px-6 py-2 font-normal">
            <Link href="/signin">Sign in</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Header with toggle buttons */}
          <div className="flex items-center justify-between w-full p-2 gap-2 border-b border-border">
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeMode === 'chat' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveMode('chat')}
                      className="h-8 text-sm"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Chats
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View chat history</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeMode === 'files' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveMode('files')}
                      className="h-8 text-sm"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Files
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View uploaded files</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      router.push('/aichat');
                      setIsOpen(false);
                    }}
                    className="h-8 w-8 text-primary"
                  >
                    <FilePlus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Create a new conversation</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {activeMode === 'files' ? (
            <div className="flex flex-col h-[calc(100vh-98px)]">
              <ScrollArea className="flex-1">
                {isLoadingFiles ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <ul className="space-y-0 mt-1">
                    {sortedUserFiles.map((file, index) => {
                      const formattedDate = format(
                        new Date(file.created_at),
                        'yyyy-MM-dd'
                      );
                      const filterTag = `${file.name}[[${formattedDate}]]`;
                      const isSelected = selectedBlobs.includes(filterTag);

                      // Get current PDF from URL parameters
                      const currentPdfParam = searchParams.get('pdf');
                      const currentPdf = currentPdfParam
                        ? decodeBase64(decodeURIComponent(currentPdfParam))
                        : null;
                      const isCurrentFile = currentPdf === file.name;

                      const currentParams = new URLSearchParams(
                        searchParams.toString()
                      );
                      currentParams.set(
                        'pdf',
                        encodeURIComponent(encodeBase64(file.name))
                      );
                      currentParams.delete('url');
                      const href = `${pathname}?${currentParams.toString()}`;

                      return (
                        <li key={index} className="border-b border-border/30">
                          <div className="grid grid-cols-[1fr,70px] w-full">
                            <Link
                              href={href}
                              className={`p-2 overflow-hidden hover:bg-muted/60 ${
                                isCurrentFile ? 'bg-muted/80' : ''
                              }`}
                              onClick={() => {
                                if (window.innerWidth < 600) {
                                  setIsOpen(false);
                                }
                              }}
                            >
                              <div className="overflow-hidden">
                                <p className="text-sm font-medium truncate text-foreground">
                                  {file.name.replace(/_/g, ' ')}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {format(new Date(file.created_at), 'PPP')}
                                </p>
                              </div>
                            </Link>
                            <div className="flex items-center justify-end pr-2 w-[70px]">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => {
                                  const newFilterTag = `${file.name}[[${formattedDate}]]`;
                                  if (selectedBlobs.includes(newFilterTag)) {
                                    setSelectedBlobs(
                                      selectedBlobs.filter(
                                        (blob) => blob !== newFilterTag
                                      )
                                    );
                                  } else {
                                    setSelectedBlobs([
                                      ...selectedBlobs,
                                      newFilterTag
                                    ]);
                                  }
                                }}
                                className="mr-1"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <form
                                action={async (formData: FormData) => {
                                  formData.append(
                                    'filePath',
                                    encodeBase64(file.name)
                                  );
                                  formData.append('filterTag', filterTag);
                                  await deleteFilterTagAndDocumentChunks(
                                    formData
                                  );
                                  await mutateFiles();
                                }}
                              >
                                <SubmitButton />
                              </form>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </ScrollArea>
              <div className="border-t border-border p-2 mt-auto bg-card">
                <ServerUploadPage />
              </div>
            </div>
          ) : (
            <div className="overflow-auto flex-1">
              {!chatPreviews ? (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-6 w-full" />
                  ))}
                </div>
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
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'Load More'
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex fixed inset-yt left-0 z-20 w-[250px] lg:w-[280px] xl:w-[300px] 2xl:w-[350px] bg-background/90 border-r border-border shadow-sm flex-col h-full">
        {SidebarContent}
      </div>
      <div className="md:pl-[200px] lg:pl-[250px] xl:pl-[300px] 2xl:pl-[350px]">
        {/* Your main content goes here */}
      </div>
      {/* Mobile drawer - with solid background & fixed position */}
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed left-4 bottom-20 z-50 md:hidden rounded-full shadow-md bg-background"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DrawerTrigger>
        <DrawerContent className="h-[85vh] max-h-[90vh] bg-background z-50">
          <DialogTitle className="px-4 pt-4">
            {activeMode === 'chat' ? 'Chat History' : 'Your Files'}
          </DialogTitle>
          <div className="bg-background w-full h-full overflow-hidden">
            {SidebarContent}
            <div className="p-4 border-t border-border">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteConfirmationOpen}
        onOpenChange={setDeleteConfirmationOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Are you sure you want to delete this chat?
          </DialogDescription>
          <DialogFooter className="flex justify-end space-x-2 mt-4">
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

// Rest of the code remains the same
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
    const [editDialogOpen, setEditDialogOpen] = useState(false);
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

    const handleOpenRename = (chatId: string) => {
      setEditingChatId(chatId);
      setEditDialogOpen(true);
    };

    const handleCloseDialog = () => {
      setEditDialogOpen(false);
      setEditingChatId(null);
      setNewTitle('');
    };

    if (optimisticChats.length === 0) return null;

    return (
      <>
        <div className="px-3 mb-2 py-2 flex items-center">
          <div className="flex-grow border-t border-border/40" />
          <span className="mx-2 text-xs text-muted-foreground">{title}</span>
          <div className="flex-grow border-t border-border/40" />
        </div>

        <ul className="space-y-0.5 px-1">
          {optimisticChats.map(({ id, firstMessage }) => {
            const currentParams = new URLSearchParams(searchParams.toString());
            const href = `/aichat/${id}${
              currentParams.toString() ? '?' + currentParams.toString() : ''
            }`;

            return (
              <li key={id} className="relative group">
                <Link
                  href={href}
                  prefetch={false}
                  scroll={false}
                  className={`
                block px-2 py-1.5 text-sm rounded relative
                hover:bg-muted/60 active:bg-muted transition-colors duration-150
                ${currentChatId === id ? 'bg-muted/80' : ''}
              `}
                  onMouseEnter={() => router.prefetch(href)}
                  onClick={() => onChatSelect(id)}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block truncate pr-6">
                          {firstMessage}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={5}>
                        {firstMessage}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-[160px] z-[100]"
                      >
                        <DropdownMenuItem
                          disabled
                          className="text-sm cursor-not-allowed"
                        >
                          <Share className="mr-2 h-4 w-4" />
                          <span>Share</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenRename(id)}
                          className="text-sm"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Rename</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(id)}
                          className="text-destructive text-sm"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

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
            >
              <input type="hidden" name="chatId" value={editingChatId ?? ''} />
              <div className="py-4">
                <Input
                  name="title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter new title"
                  className="w-full"
                  autoFocus
                  required
                />
              </div>
              <DialogFooter className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
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
  }
);

RenderChatSection.displayName = 'RenderChatSection';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="ghost"
      size="icon"
      disabled={pending}
      className="h-8 w-8 text-destructive"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash className="h-4 w-4" />
      )}
    </Button>
  );
}

export default CombinedDrawer;
