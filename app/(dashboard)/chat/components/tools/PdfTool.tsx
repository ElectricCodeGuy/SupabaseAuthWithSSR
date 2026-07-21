import React from 'react';
import {
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink
} from 'lucide-react';
import type { ToolUIPart } from 'ai';
import type { UITools } from '@/app/(dashboard)/chat/types/tooltypes';
import Link from '@/components/link';
import { Button } from '@/components/ui/button';

interface PdfToolProps {
  toolInvocation: Extract<ToolUIPart<UITools>, { type: 'tool-createPDF' }>;
  index: string;
}

export const PdfTool: React.FC<PdfToolProps> = ({ toolInvocation }) => {
  const title = toolInvocation.input?.title;
  const output =
    toolInvocation.state === 'output-available'
      ? toolInvocation.output
      : undefined;
  const isLoading =
    toolInvocation.state === 'input-streaming' ||
    toolInvocation.state === 'input-available';
  const failed =
    toolInvocation.state === 'output-error' ||
    (output ? !output.success : false);

  return (
    <div className="my-2 rounded-lg border bg-card p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/10">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-grow">
          <p className="truncate text-sm font-medium text-foreground">
            {output && 'fileName' in output && output.fileName
              ? output.fileName
              : title
                ? `${title}.pdf`
                : 'PDF document'}
          </p>
          <p className="text-xs text-muted-foreground">
            {isLoading
              ? 'Generating PDF…'
              : failed
                ? output?.message || toolInvocation.errorText || 'Failed'
                : 'Saved to your files'}
          </p>
        </div>
        <div className="flex-shrink-0">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : failed ? (
            <XCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
          ) : output && 'viewerUrl' in output && output.viewerUrl ? (
            <Button asChild variant="outline" size="sm" className="h-7 text-xs">
              <Link href={output.viewerUrl} prefetch={false}>
                <ExternalLink className="mr-1 h-3 w-3" />
                Open
              </Link>
            </Button>
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
          )}
        </div>
      </div>
    </div>
  );
};
