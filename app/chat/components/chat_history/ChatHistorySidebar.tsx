'use client';
import React, { type FC, useState, useCallback } from 'react';
import { fetchMoreChatPreviews } from '../../actions';
import { useParams, useSearchParams } from 'next/navigation';
import useSWRInfinite from 'swr/infinite';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar
} from '@/components/ui/sidebar';
import {
  Menu,
  FileText,
  MessageSquare,
  PanelLeftIcon,
  FilePlus,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import type { Tables } from '@/types/database';
import ChatHistorySection from './ChatHistorySection';
import FilesSection from './FilesSection';
import UploadPage from './FileUpload';

type UserInfo = Pick<Tables<'users'>, 'full_name' | 'email' | 'id'>;
type UserDocument = Pick<
  Tables<'user_documents'>,
  'id' | 'title' | 'created_at' | 'total_pages' | 'filter_tags'
>;
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
  documents: UserDocument[];
}

const CombinedDrawer: FC<CombinedDrawerProps> = ({
  userInfo,
  initialChatPreviews,
  categorizedChats,
  documents
}) => {
  const [activeMode, setActiveMode] = useState<'chat' | 'files'>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const params = useParams();
  const searchParams = useSearchParams();
  const currentChatId = typeof params.id === 'string' ? params.id : undefined;
  const { setOpenMobile } = useSidebar();

  // Only chat data needs infinite loading
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

  const handleChatSelect = useCallback(() => {
    if (window.innerWidth < 1200) {
      setOpenMobile(false);
    }
  }, [setOpenMobile]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Minimized sidebar when closed
  if (!sidebarOpen) {
    return (
      <div className="h-[calc(100vh-48px)] sticky top-0 border border-[rgba(0,0,0,0.1)] w-[50px] flex-shrink-0 bg-background flex flex-col items-center py-2">
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
    );
  }

  return (
    <Sidebar
      collapsible="icon"
      className="h-[calc(100vh-48px)] sticky top-0 border border-[rgba(0,0,0,0.1)] w-0 md:w-[240px] lg:w-[280px] flex-shrink-0"
    >
      <SidebarHeader className="p-1">
        <SidebarMenu>
          <SidebarMenuItem>
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
          <div className="flex flex-col items-center justify-center h-[90vh] text-center p-4 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              Sign in to save and view your chats
            </h3>
            <Button asChild className="rounded-md px-6 py-2 font-normal">
              <Link href="/signin">Sign in</Link>
            </Button>
          </div>
        ) : activeMode === 'files' ? (
          <FilesSection
            searchParams={searchParams}
            onChatSelect={handleChatSelect}
            documents={documents}
          />
        ) : (
          <ChatHistorySection
            initialChatPreviews={initialChatPreviews}
            categorizedChats={categorizedChats}
            currentChatId={currentChatId}
            searchParams={searchParams}
            onChatSelect={handleChatSelect}
            mutateChatPreviews={mutateChatPreviews}
          />
        )}
      </SidebarContent>

      <SidebarFooter className="px-0 pb-0">
        {activeMode === 'files' ? (
          <UploadPage />
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
  );
};

export default CombinedDrawer;
