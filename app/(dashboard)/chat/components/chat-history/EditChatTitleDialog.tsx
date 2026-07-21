'use client';

import { type FC, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateChatTitle } from '../../actions';

interface EditChatTitleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: string;
  currentTitle: string;
  onSaved?: () => void;
}

const EditChatTitleDialog: FC<EditChatTitleDialogProps> = ({
  open,
  onOpenChange,
  chatId,
  currentTitle,
  onSaved
}) => {
  const [title, setTitle] = useState(currentTitle);
  const [isSaving, setIsSaving] = useState(false);

  // Keep the field in sync when the dialog is (re)opened for a different
  // chat. "Adjust state during render" pattern — the set is guarded by the
  // prevOpen comparison, so React re-renders once and never loops.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setTitle(currentTitle);
  }

  const handleSave = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    setIsSaving(true);
    const formData = new FormData();
    formData.append('title', trimmed);
    formData.append('chatId', chatId);
    const result = await updateChatTitle(formData);
    setIsSaving(false);

    if (!result.success) {
      toast.error(result.message ?? 'Failed to update title');
      return;
    }
    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename chat</DialogTitle>
          <DialogDescription>Enter a new title for this chat.</DialogDescription>
        </DialogHeader>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Chat title"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
          }}
        />
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
            {isSaving ? (
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
  );
};

export default EditChatTitleDialog;
