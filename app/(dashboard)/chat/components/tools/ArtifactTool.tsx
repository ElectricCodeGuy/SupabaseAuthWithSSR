// Inline chat card for a workspace-document version (tool-createArtifact /
// tool-updateArtifact part). The document itself renders in the side panel —
// this card only shows status and an "Open" affordance.
import React from 'react';
import { FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';
import type { ToolUIPart } from 'ai';
import type { UITools } from '@/app/(dashboard)/chat/types/tooltypes';
import { Button } from '@/components/ui/button';

type ArtifactPart = Extract<
  ToolUIPart<UITools>,
  { type: 'tool-createArtifact' } | { type: 'tool-updateArtifact' }
>;

interface ArtifactToolProps {
  toolInvocation: ArtifactPart;
  onOpen: () => void;
}

export const ArtifactTool: React.FC<ArtifactToolProps> = ({
  toolInvocation,
  onOpen
}) => {
  const isCreate = toolInvocation.type === 'tool-createArtifact';
  const input = toolInvocation.input;
  const output = toolInvocation.output as
    | { artifactId?: string; version?: number; title?: string; error?: string }
    | undefined;

  const failed =
    toolInvocation.state === 'output-error' ||
    (toolInvocation.state === 'output-available' && !output?.artifactId);
  const streaming =
    toolInvocation.state === 'input-streaming' ||
    toolInvocation.state === 'input-available';

  const title = output?.title || input?.title || 'Document';

  const statusText = failed
    ? isCreate
      ? 'Could not create the document'
      : 'Could not update the document'
    : streaming
      ? isCreate
        ? 'Writing document…'
        : 'Revising document…'
      : isCreate
        ? 'Document created'
        : `Updated to version ${output?.version ?? ''}`.trimEnd();

  return (
    <div
      className={`my-1 flex items-center gap-3 rounded-lg border px-3 py-2 shadow-sm ${
        failed
          ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
          : 'border-[rgba(0,127,255,0.1)] bg-[rgba(240,249,255,0.7)] dark:border-blue-800/30 dark:bg-blue-950/40'
      }`}
    >
      {failed ? (
        <XCircle className="h-4 w-4 shrink-0 text-red-500 dark:text-red-400" />
      ) : streaming ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600 dark:text-blue-400" />
      ) : (
        <CheckCircle className="h-4 w-4 shrink-0 text-green-500 dark:text-green-400" />
      )}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-medium">
          <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{title}</span>
        </p>
        <p className="text-xs text-muted-foreground">{statusText}</p>
      </div>
      {!failed && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 rounded-md"
          onClick={onOpen}
        >
          Open
        </Button>
      )}
    </div>
  );
};
