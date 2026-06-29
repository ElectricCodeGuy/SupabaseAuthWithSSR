'use client';

import { type FC, type ReactNode, useState, useTransition } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal,
  Star,
  Pencil,
  Share2,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { setChatFavorite, deleteChatData } from '../../actions';
import EditChatTitleDialog from './EditChatTitleDialog';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import ShareDialog from './ShareDialog';

interface ChatActionsMenuProps {
  chatId: string;
  title: string;
  isFavorite: boolean;
  isPublic: boolean;
  align?: 'start' | 'end';
  /** Custom trigger. Defaults to a 3-dot ghost button. */
  trigger?: ReactNode;
  /** Called after favorite/rename/share so callers can revalidate lists. */
  onChanged?: () => void;
  /** Called after the chat is deleted. */
  onDeleted?: () => void;
}

const ChatActionsMenu: FC<ChatActionsMenuProps> = ({
  chatId,
  title,
  isFavorite,
  isPublic,
  align = 'end',
  trigger,
  onChanged,
  onDeleted
}) => {
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const handleToggleFavorite = () => {
    startTransition(async () => {
      const result = await setChatFavorite(chatId, !isFavorite);
      if (!result.success) {
        toast.error(result.message ?? 'Failed to toggle favorite');
        return;
      }
      onChanged?.();
    });
  };

  const handleDelete = async () => {
    const result = await deleteChatData(chatId);
    if (!result.success) {
      toast.error(result.message ?? 'Failed to delete chat');
      return;
    }
    onDeleted?.();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger ?? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              aria-label="Chat actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="rounded-lg">
          <DropdownMenuItem
            onClick={handleToggleFavorite}
            disabled={isPending}
          >
            <Star
              className={`mr-2 h-4 w-4 ${
                isFavorite ? 'fill-yellow-400 text-yellow-400' : ''
              }`}
            />
            <span>{isFavorite ? 'Remove favorite' : 'Favorite'}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShareOpen(true)}>
            <Share2 className="mr-2 h-4 w-4" />
            <span>{isPublic ? 'Manage sharing' : 'Share'}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditChatTitleDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        chatId={chatId}
        currentTitle={title}
        onSaved={onChanged}
      />
      <DeleteConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
      />
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        chatId={chatId}
        isPublic={isPublic}
        onChanged={onChanged}
      />
    </>
  );
};

export default ChatActionsMenu;
