'use client';

import { type FC, useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Copy, Loader2, Share, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { shareChat, unshareChat } from '../../actions';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: string;
  isPublic: boolean;
  onChanged?: () => void;
}

const ShareDialog: FC<ShareDialogProps> = ({
  open,
  onOpenChange,
  chatId,
  isPublic,
  onChanged
}) => {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/shared-chat/${chatId}`
      : `/shared-chat/${chatId}`;

  const handleShare = () => {
    startTransition(async () => {
      const result = await shareChat(chatId);
      if (!result.success) {
        toast.error(result.message ?? 'Failed to share chat');
        return;
      }
      onChanged?.();
      toast.success('Chat is now public');
    });
  };

  const handleUnshare = () => {
    startTransition(async () => {
      const result = await unshareChat(chatId);
      if (!result.success) {
        toast.error(result.message ?? 'Failed to disable sharing');
        return;
      }
      onChanged?.();
      toast.success('Sharing disabled');
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share chat</DialogTitle>
          <DialogDescription>
            {isPublic
              ? 'Anyone with the link can view this conversation.'
              : 'Create a public link to share this conversation.'}
          </DialogDescription>
        </DialogHeader>

        {isPublic ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input value={shareUrl} readOnly className="flex-1" />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                aria-label="Copy link"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button
              variant="destructive"
              onClick={handleUnshare}
              disabled={isPending}
              className="w-full"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Ban className="mr-2 h-4 w-4" />
              )}
              <span>Stop sharing</span>
            </Button>
          </div>
        ) : (
          <Button onClick={handleShare} disabled={isPending} className="w-full">
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Share className="mr-2 h-4 w-4" />
            )}
            <span>Create public link</span>
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
