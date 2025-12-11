'use client';

import { type FC, useState, lazy, Suspense, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare } from 'lucide-react';

// Lazy load the chat history content
const ChatHistorySheetContent = lazy(() => import('./ChatHistorySheetContent'));

export const ChatHistoryButton: FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs rounded-md flex items-center gap-1.5 cursor-pointer hover:bg-primary/5 dark:hover:bg-primary/10"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Chat History</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[320px] sm:w-[400px] p-0 flex flex-col"
      >
        <Suspense fallback={<ChatHistorySheetSkeleton />}>
          {isOpen && <ChatHistorySheetContent onClose={handleClose} />}
        </Suspense>
      </SheetContent>
    </Sheet>
  );
};

const ChatHistorySheetSkeleton: FC = () => (
  <>
    <SheetHeader className="p-4 border-b">
      <SheetTitle>Chat History</SheetTitle>
    </SheetHeader>
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="w-full h-10" />
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="w-full h-10" />
        ))}
      </div>
    </div>
  </>
);

export default ChatHistoryButton;
