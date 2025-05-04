'use client';
import React, {
  type FC,
  useState,
  useCallback,
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
  FileText, // For file mode toggle
  MessageSquare, // For chat mode toggle
  PanelLeftIcon // For sidebar toggle
} from 'lucide-react';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  useSidebar
} from '@/components/ui/sidebar';

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
  // State management
  const [activeMode, setActiveMode] = useState<'chat' | 'files'>('chat');
  const { selectedBlobs, setSelectedBlobs } = useUpload();
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Routing
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentChatId = typeof params.id === 'string' ? params.id : undefined;

  // Use the sidebar hook for mobile
  const { setOpenMobile } = useSidebar();

  // Data fetching with SWR
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

  // Handler functions
  const loadMoreChats = useCallback(async () => {
    if (!isLoadingMore) {
      await setSize(size + 1);
    }
  }, [isLoadingMore, setSize, size]);

  const handleDeleteClick = (id: string) => {
    setChatToDelete(id);
    setDeleteConfirmationOpen(true);
  };

  const handleOpenRename = (chatId: string) => {
    setEditingChatId(chatId);
    const chat = initialChatPreviews.find((chat) => chat.id === chatId);
    if (chat) setNewTitle(chat.firstMessage);
    setEditDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditDialogOpen(false);
    setEditingChatId(null);
    setNewTitle('');
  };

  const handleDeleteConfirmation = async () => {
    if (chatToDelete) {
      try {
        await deleteChatData(chatToDelete);
        await mutateChatPreviews();

        if (chatToDelete === currentChatId) {
          router.push('/chat');
        }
      } catch (error) {
        console.error('Failed to delete the chat:', error);
      }
    }
    setDeleteConfirmationOpen(false);
    setChatToDelete(null);
  };

  const handleChatSelect = useCallback(() => {
    // Close sidebar on mobile
    if (window.innerWidth < 1200) {
      setOpenMobile(false);
    }
  }, [setOpenMobile]);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Render the minimized sidebar when closed
  if (!sidebarOpen) {
    return (
      <>
        <div className="h-[calc(100vh-48px)] sticky top-0 border border-[rgba(0,0,0,0.1)] w-[50px] flex-shrink-0 bg-background flex flex-col items-center py-2">
          {/* Toggle button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="mb-2"
                  aria-label="Open sidebar"
                >
                  <Menu size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Open sidebar</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Separator className="w-4/5 my-2" />

          {/* New chat button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  aria-label="Start new chat"
                  className="my-2"
                >
                  <a href="/chat">
                    <FilePlus size={20} />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">New chat</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Mode toggle buttons */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setActiveMode('chat');
                    setSidebarOpen(true);
                  }}
                  className={`my-2 ${
                    activeMode === 'chat' ? 'text-primary' : ''
                  }`}
                  aria-label="Chat mode"
                >
                  <MessageSquare size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Chat history</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setActiveMode('files');
                    setSidebarOpen(true);
                  }}
                  className={`my-2 ${
                    activeMode === 'files' ? 'text-primary' : ''
                  }`}
                  aria-label="Files mode"
                >
                  <FileText size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Documents</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Dialogs */}
        <Dialog
          open={deleteConfirmationOpen}
          onOpenChange={setDeleteConfirmationOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this chat?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-around">
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

        <Dialog
          open={editDialogOpen}
          onOpenChange={(open) => !open && handleCloseDialog()}
        >
          <DialogContent className="p-3 max-w-[90vw] sm:max-w-[350px]">
            <DialogTitle className="text-center">Rename Chat</DialogTitle>
            <form
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);

                startTransition(async () => {
                  await updateChatTitle(formData);
                  await mutateChatPreviews();
                });

                handleCloseDialog();
              }}
            >
              <input type="hidden" name="chatId" value={editingChatId || ''} />

              <div className="space-y-2 py-2">
                <Input
                  autoFocus
                  name="title"
                  placeholder="New title"
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full"
                />
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={handleCloseDialog}
                  className="mr-1 text-destructive"
                >
                  Cancel
                </Button>
                <Button variant="outline" type="submit">
                  Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Main sidebar content
  return (
    <>
      <Sidebar
        collapsible="icon"
        className="h-[calc(100vh-48px)] sticky top-0 border border-[rgba(0,0,0,0.1)] w-0 md:w-[240px] lg:w-[280px] flex-shrink-0"
      >
        <SidebarHeader className="p-1">
          <SidebarMenu>
            <SidebarMenuItem>
              {/* Mode toggle and new chat */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden w-full mb-2">
                <button
                  className={`px-3 py-1.5 text-xs font-medium flex-1 ${
                    activeMode === 'chat'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-transparent text-foreground hover:bg-muted/50'
                  } transition-colors`}
                  onClick={() => setActiveMode('chat')}
                >
                  Chat History
                </button>
                <button
                  className={`px-3 py-1.5 text-xs font-medium flex-1 ${
                    activeMode === 'files'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-transparent text-foreground hover:bg-muted/50'
                  } transition-colors`}
                  onClick={() => setActiveMode('files')}
                >
                  Files
                </button>
              </div>
            </SidebarMenuItem>
            <SidebarMenuItem>
              {/* New chat and toggle button in same flex container */}
              <div className="flex items-center justify-between w-full">
                <SidebarMenuButton asChild className="flex-grow">
                  <a href="/chat" aria-label="Start new chat">
                    <FilePlus size={16} />
                    <span>New Chat</span>
                  </a>
                </SidebarMenuButton>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="text-muted-foreground hover:text-foreground ml-2 hidden sm:block"
                  aria-label="Close sidebar"
                >
                  <PanelLeftIcon size={18} />
                </Button>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="border-t border-gray-200">
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
          ) : activeMode === 'files' ? (
            // Files view
            <SidebarGroup className="px-0">
              <SidebarGroupLabel>Your Files</SidebarGroupLabel>
              <SidebarGroupContent>
                {isLoadingFiles ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <SidebarMenu>
                    {sortedUserFiles.map((file, index) => {
                      const formattedDate = format(
                        new Date(file.created_at),
                        'yyyy-MM-dd'
                      );
                      const filterTag = `${file.name}[[${formattedDate}]]`;
                      const isSelected = selectedBlobs.includes(filterTag);
                      const displayName = file.name.replace(/_/g, ' ');

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
                        <SidebarMenuItem
                          key={index}
                          className="flex w-full items-center gap-2"
                        >
                          {/* Left side: File info with tooltip */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger
                                asChild
                                className="flex-grow min-w-0"
                              >
                                <a
                                  href={href}
                                  onClick={handleChatSelect}
                                  className={`block p-2 rounded hover:bg-muted/50 transition-colors ${
                                    isCurrentFile ? 'bg-muted/80' : ''
                                  }`}
                                >
                                  <div className="text-sm font-medium truncate">
                                    {displayName}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {format(new Date(file.created_at), 'PPP')}
                                  </div>
                                </a>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="max-w-[300px] break-words"
                              >
                                {displayName}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {/* Right side: Actions */}
                          <div className="flex items-center space-x-1 pr-1">
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
                                router.refresh();
                              }}
                            >
                              <SubmitButton />
                            </form>
                          </div>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          ) : (
            // Chat history view
            <>
              {!chatPreviews ? (
                <SidebarGroup>
                  <SidebarGroupLabel>Loading...</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <SidebarMenuItem key={index}>
                          <Skeleton className="w-full h-8" />
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ) : (
                <>
                  <RenderChatSectionWithSidebar
                    title="Today"
                    chats={categorizedChats.today}
                    currentChatId={currentChatId}
                    handleDeleteClick={handleDeleteClick}
                    handleOpenRename={handleOpenRename}
                    onChatSelect={handleChatSelect}
                  />
                  <RenderChatSectionWithSidebar
                    title="Yesterday"
                    chats={categorizedChats.yesterday}
                    currentChatId={currentChatId}
                    handleDeleteClick={handleDeleteClick}
                    handleOpenRename={handleOpenRename}
                    onChatSelect={handleChatSelect}
                  />
                  <RenderChatSectionWithSidebar
                    title="Last 7 days"
                    chats={categorizedChats.last7Days}
                    currentChatId={currentChatId}
                    handleDeleteClick={handleDeleteClick}
                    handleOpenRename={handleOpenRename}
                    onChatSelect={handleChatSelect}
                  />
                  <RenderChatSectionWithSidebar
                    title="Last 30 days"
                    chats={categorizedChats.last30Days}
                    currentChatId={currentChatId}
                    handleDeleteClick={handleDeleteClick}
                    handleOpenRename={handleOpenRename}
                    onChatSelect={handleChatSelect}
                  />
                  <RenderChatSectionWithSidebar
                    title="Last 2 months"
                    chats={categorizedChats.last2Months}
                    currentChatId={currentChatId}
                    handleDeleteClick={handleDeleteClick}
                    handleOpenRename={handleOpenRename}
                    onChatSelect={handleChatSelect}
                  />
                  <RenderChatSectionWithSidebar
                    title="Older"
                    chats={categorizedChats.older}
                    currentChatId={currentChatId}
                    handleDeleteClick={handleDeleteClick}
                    handleOpenRename={handleOpenRename}
                    onChatSelect={handleChatSelect}
                  />
                </>
              )}
            </>
          )}
        </SidebarContent>

        <SidebarFooter className="px-0">
          {activeMode === 'files' ? (
            <ServerUploadPage />
          ) : hasMore ? (
            <Button
              onClick={loadMoreChats}
              disabled={isLoadingMore}
              variant="outline"
              className="rounded-lg m-2"
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
          ) : null}
        </SidebarFooter>
      </Sidebar>

      {/* Dialogs */}
      <Dialog
        open={deleteConfirmationOpen}
        onOpenChange={setDeleteConfirmationOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chat?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-around">
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

      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <DialogContent className="p-3 max-w-[90vw] sm:max-w-[350px]">
          <DialogTitle className="text-center">Rename Chat</DialogTitle>
          <form
            onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);

              startTransition(async () => {
                await updateChatTitle(formData);
                await mutateChatPreviews();
              });

              handleCloseDialog();
            }}
          >
            <input type="hidden" name="chatId" value={editingChatId || ''} />

            <div className="space-y-2 py-2">
              <Input
                autoFocus
                name="title"
                placeholder="New title"
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full"
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCloseDialog}
                className="mr-1 text-destructive"
              >
                Cancel
              </Button>
              <Button variant="outline" type="submit">
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

interface RenderChatSectionProps {
  title: string;
  chats: ChatPreview[];
  currentChatId: string | undefined;
  handleDeleteClick: (id: string) => void;
  handleOpenRename: (id: string) => void;
  onChatSelect: (id: string) => void;
}

const RenderChatSectionWithSidebar: FC<RenderChatSectionProps> = ({
  title,
  chats,
  currentChatId,
  handleDeleteClick,
  handleOpenRename,
  onChatSelect
}) => {
  const searchParams = useSearchParams();

  if (chats.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {chats.map(({ id, firstMessage }) => {
            const currentParams = new URLSearchParams(searchParams.toString());
            const href = `/chat/${id}${
              currentParams.toString() ? '?' + currentParams.toString() : ''
            }`;

            return (
              <SidebarMenuItem key={id}>
                <SidebarMenuButton
                  asChild
                  isActive={currentChatId === id}
                  onClick={() => onChatSelect(id)}
                >
                  <a href={href}>
                    <span className="truncate">{firstMessage}</span>
                  </a>
                </SidebarMenuButton>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction>
                      <MoreHorizontal size={16} />
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="rounded-lg">
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
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

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
