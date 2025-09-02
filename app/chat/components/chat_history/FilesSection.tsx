import React, { type FC } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useUpload } from '../../context/uploadContext';
import { deleteFilterTagAndDocumentChunks } from '../../actions';
import { useFormStatus } from 'react-dom';
import { Loader2, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem
} from '@/components/ui/sidebar';
import Link from 'next/link';
import type { Tables } from '@/types/database';
import { decodeBase64, encodeBase64 } from '../../utils/base64';

type UserDocument = Pick<
  Tables<'user_documents'>,
  'id' | 'title' | 'created_at' | 'total_pages' | 'file_path'
>;
interface FilesSectionProps {
  searchParams: URLSearchParams;
  onChatSelect: () => void;
  documents: UserDocument[];
}

const FilesSection: FC<FilesSectionProps> = ({
  searchParams,
  onChatSelect,
  documents
}) => {
  const { selectedBlobs, setSelectedBlobs } = useUpload();
  const router = useRouter();

  // Get the current PDF from URL parameters
  const currentPdfParam = searchParams.get('pdf');
  const currentPdf = currentPdfParam
    ? decodeBase64(decodeURIComponent(currentPdfParam))
    : null;

  return (
    <SidebarGroup className="px-0">
      <SidebarGroupLabel>Your Documents</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {documents.map((document) => {
            const displayName = document.title;
            const isSelected = selectedBlobs.includes(document.id);
            const isCurrentFile = currentPdf === document.title;

            const newParams = new URLSearchParams(searchParams.toString());
            newParams.set(
              'pdf',
              encodeURIComponent(encodeBase64(document.title))
            );
            newParams.delete('url');
            const href = `?${newParams.toString()}`;

            return (
              <SidebarMenuItem
                key={document.id}
                className="flex w-full items-center gap-2"
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild className="flex-grow min-w-0">
                      <Link
                        href={href}
                        prefetch={false}
                        onMouseEnter={() => {
                          router.prefetch(href);
                        }}
                        onClick={onChatSelect}
                        className={`block p-2 rounded hover:bg-muted/50 transition-colors ${
                          isCurrentFile ? 'bg-muted/80' : ''
                        }`}
                      >
                        <div className="text-sm font-medium truncate">
                          {displayName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(document.created_at), 'PPP')}
                        </div>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="max-w-[300px] break-words"
                    >
                      {displayName}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="flex items-center space-x-1 pr-1">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => {
                      if (selectedBlobs.includes(document.id)) {
                        setSelectedBlobs(
                          selectedBlobs.filter((blob) => blob !== document.id)
                        );
                      } else {
                        setSelectedBlobs([...selectedBlobs, document.id]);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <form
                    action={async (formData: FormData) => {
                      formData.append(
                        'file_name',
                        encodeBase64(document.title)
                      );
                      formData.append('file_id', document.id);
                      await deleteFilterTagAndDocumentChunks(formData);
                    }}
                  >
                    <SubmitButton />
                  </form>
                </div>
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

export default FilesSection;
