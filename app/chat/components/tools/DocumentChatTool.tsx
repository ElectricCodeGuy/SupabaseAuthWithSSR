// app/chat/components/tools/DocumentChatTool.tsx
import React from 'react';
import { FileText, CheckCircle } from 'lucide-react';
import type { ToolUIPart } from 'ai';
import type { UITools } from '@/app/chat/types/tooltypes';

interface DocumentsToolProps {
  toolInvocation: Extract<
    ToolUIPart<UITools>,
    { type: 'tool-searchUserDocument' }
  >;
}

const DocumentsTool: React.FC<DocumentsToolProps> = ({ toolInvocation }) => {
  const query = toolInvocation.input?.query || '';

  switch (toolInvocation.state) {
    case 'input-streaming':
      return (
        <div className="my-1 p-2 bg-muted/30 rounded-md border border-border/50">
          <div className="flex items-center gap-2">
            <FileText className="text-primary" size={18} />
            <span className="text-sm font-medium text-foreground">
              Preparing document search...
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-xs text-muted-foreground">
              Streaming input...
            </span>
          </div>
        </div>
      );

    case 'input-available':
      return (
        <div className="my-1 p-2 bg-muted/30 rounded-md border border-border/50">
          <div className="flex items-center gap-2">
            <FileText className="text-primary" size={18} />
            <span className="text-sm font-medium text-foreground">
              Searching in documents
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-xs text-muted-foreground">Searching...</span>
          </div>
          {query && (
            <div className="mt-2">
              <span className="text-xs font-bold text-muted-foreground">
                Search query: {query}
              </span>
            </div>
          )}
        </div>
      );

    case 'output-available':
      return (
        <div className="my-1 p-2 bg-primary/5 dark:bg-primary/10 rounded-md border border-primary/20 dark:border-primary/30">
          <div className="flex items-center gap-2 mt-2">
            <CheckCircle
              size={16}
              className="text-green-600 dark:text-green-400"
            />
            <span className="text-xs text-green-700 dark:text-green-400">
              Search completed
            </span>
          </div>
          {query && (
            <div className="mt-1">
              <span className="text-xs text-foreground/70">
                Search query: {query}
              </span>
            </div>
          )}
        </div>
      );

    case 'output-error':
      return (
        <div className="my-1 p-2 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-600 dark:text-red-400">
              Error: {toolInvocation.errorText || 'Search failed'}
            </span>
          </div>
        </div>
      );

    default:
      return null;
  }
};

export default DocumentsTool;
