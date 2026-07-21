'use client';

import React, { useState } from 'react';
import {
  FileText,
  BookOpen,
  Files,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import type { ToolUIPart } from 'ai';
import type { UITools } from '@/app/(dashboard)/chat/types/tooltypes';
import Link from '@/components/link';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

// Client-side base64 encoding for URLs
function encodeBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

interface InlineToolSectionProps {
  icon: React.ReactNode;
  label: string;
  summary?: string;
  state: string;
  isSuccess?: boolean;
  loadingText?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const InlineToolSection: React.FC<InlineToolSectionProps> = ({
  icon,
  label,
  summary,
  state,
  isSuccess = true,
  loadingText,
  defaultOpen = false,
  children
}) => {
  const [open, setOpen] = useState(defaultOpen);

  const isLoading = state === 'input-streaming' || state === 'input-available';
  const isError =
    state === 'output-error' || (state === 'output-available' && !isSuccess);
  const isDone = state === 'output-available' && isSuccess;

  const statusIcon = isLoading ? (
    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
  ) : isError ? (
    <XCircle className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
  ) : isDone ? (
    <CheckCircle className="h-3.5 w-3.5 text-green-500 dark:text-green-400" />
  ) : null;

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="my-1.5 rounded-lg border border-border/60 bg-background/50 dark:bg-background/30"
    >
      <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 px-3 rounded-lg text-left cursor-pointer hover:bg-muted/40 transition-colors">
        <ChevronRight
          className={cn(
            'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 shrink-0',
            open && 'rotate-90'
          )}
        />
        <span className="shrink-0">{icon}</span>
        <span className="text-sm text-muted-foreground grow truncate">
          {isLoading && loadingText ? loadingText : label}
        </span>
        {summary && isDone && (
          <span className="text-xs text-muted-foreground/70 shrink-0">
            {summary}
          </span>
        )}
        <span className="shrink-0">{statusIcon}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 pb-2.5 pt-0.5">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};

interface DocumentChatToolProps {
  toolInvocation: Extract<
    ToolUIPart<UITools>,
    { type: 'tool-searchUserDocument' }
  >;
  index: string;
}

interface DocSummary {
  id: string;
  title: string;
  fileName: string;
  description?: string;
  topics?: string[];
  totalPages?: number;
}

interface SearchHit {
  documentId: string;
  title: string;
  fileName: string;
  page: number;
  totalPages: number;
  text: string;
}

type DocOutput =
  | { mode: 'list' | 'findByName'; query?: string; documents: DocSummary[] }
  | { mode: 'search'; query: string; results: SearchHit[] }
  | {
      mode: 'content';
      document?: DocSummary;
      pageStart?: number | null;
      pageEnd?: number | null;
      pages?: { page: number; text: string }[];
      truncated?: boolean;
      error?: string;
    };

const DocumentChatTool: React.FC<DocumentChatToolProps> = ({
  toolInvocation
}) => {
  const [showAll, setShowAll] = useState(false);
  const output = toolInvocation.output as DocOutput | undefined;

  const isSearch = output?.mode === 'search';
  const isContent = output?.mode === 'content';
  const docs: DocSummary[] =
    output && (output.mode === 'list' || output.mode === 'findByName')
      ? (output.documents ?? [])
      : [];
  const hits: SearchHit[] =
    output && output.mode === 'search' ? (output.results ?? []) : [];

  const items = isSearch ? hits : docs;
  const count = items.length;
  const displayItems = showAll ? items : items.slice(0, 3);
  const remaining = count - 3;

  const label = isSearch
    ? 'Searching documents'
    : isContent
      ? 'Reading document content'
      : output?.mode === 'findByName'
        ? 'Finding documents'
        : 'Reading your documents';

  const summaryText =
    count > 0 && toolInvocation.state === 'output-available'
      ? `${count} ${count === 1 ? 'document' : 'documents'}`
      : undefined;

  return (
    <InlineToolSection
      icon={<Files className="text-primary h-4 w-4" />}
      label={label}
      summary={summaryText}
      state={toolInvocation.state}
      loadingText={`${label}…`}
    >
      <div className="max-h-96 overflow-y-auto space-y-2">
        {output && 'query' in output && output.query && (
          <div className="text-xs">
            <span className="font-bold text-gray-700 dark:text-gray-300">
              Search query:
            </span>{' '}
            <span className="dark:text-gray-400">{output.query}</span>
          </div>
        )}

        {toolInvocation.state === 'output-available' && (
          <>
            {count === 0 && !isContent && (
              <div className="text-xs dark:text-gray-400 italic">
                No documents found.
              </div>
            )}

            {/* Full-content read (getContent) */}
            {isContent && output?.mode === 'content' && (
              output.error ? (
                <div className="text-xs text-red-600 dark:text-red-400">
                  {output.error}
                </div>
              ) : output.document ? (
                <Link
                  href={`?pdf=${encodeBase64(output.document.fileName.trim())}${output.pageStart ? `&p=${output.pageStart}` : ''}`}
                  className="block p-2 rounded bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50 group hover:no-underline"
                >
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                    <h5 className="text-xs font-medium truncate text-gray-900 dark:text-gray-100 group-hover:text-primary">
                      {output.document.title}
                    </h5>
                    <Badge
                      variant="outline"
                      className="ml-auto text-[10px] px-1 py-0"
                    >
                      {output.pageStart && output.pageEnd
                        ? `p. ${output.pageStart}–${output.pageEnd}`
                        : 'full text'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 pb-0">
                    {`Read ${output.pages?.length ?? 0} page${(output.pages?.length ?? 0) === 1 ? '' : 's'}${output.truncated ? ' (truncated — more available)' : ''}`}
                  </p>
                </Link>
              ) : null
            )}

            {/* Search snippets */}
            {isSearch &&
              (displayItems as SearchHit[]).map((hit, idx) => (
                <Link
                  key={`${hit.documentId}-${hit.page}-${idx}`}
                  href={`?pdf=${encodeBase64(hit.fileName.trim())}&p=${hit.page}`}
                  className="block p-2 rounded bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50 group hover:no-underline"
                >
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                    <h5 className="text-xs font-medium truncate text-gray-900 dark:text-gray-100 group-hover:text-primary">
                      {hit.title}
                    </h5>
                    <Badge
                      variant="outline"
                      className="ml-auto text-[10px] px-1 py-0"
                    >
                      p. {hit.page}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 line-clamp-3 pb-0">
                    {hit.text}
                  </p>
                </Link>
              ))}

            {/* Document list / name lookup */}
            {!isSearch &&
              (displayItems as DocSummary[]).map((doc) => (
                <Link
                  key={doc.id}
                  href={`?pdf=${encodeBase64(doc.fileName.trim())}`}
                  className="block p-2 rounded bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50 group hover:no-underline"
                >
                  <div className="flex items-start gap-2">
                    <FileText className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-medium line-clamp-2 text-gray-900 dark:text-gray-100 group-hover:text-primary">
                        {doc.title}
                      </h5>
                      {doc.description && (
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 pb-0">
                          {doc.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {doc.totalPages ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1 py-0"
                          >
                            <BookOpen className="w-2.5 h-2.5 mr-0.5" />
                            <span>{doc.totalPages} pages</span>
                          </Badge>
                        ) : null}
                        {doc.topics?.slice(0, 2).map((topic) => (
                          <Badge
                            key={topic}
                            variant="secondary"
                            className="text-[10px] px-1 py-0"
                          >
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

            {remaining > 0 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="flex items-center justify-center gap-1 text-xs text-primary hover:underline w-full"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-2.5 w-2.5" />
                    <span>Show fewer</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-2.5 w-2.5" />
                    <span>+{remaining} more</span>
                  </>
                )}
              </button>
            )}
          </>
        )}

        {(toolInvocation.state === 'input-streaming' ||
          toolInvocation.state === 'input-available') && (
          <div className="text-xs dark:text-gray-400 italic">{label}…</div>
        )}

        {toolInvocation.state === 'output-error' && (
          <div className="text-xs text-red-600 dark:text-red-400">
            <span className="font-bold">Error:</span>{' '}
            <span>{toolInvocation.errorText || 'Document lookup failed'}</span>
          </div>
        )}
      </div>
    </InlineToolSection>
  );
};

export default DocumentChatTool;
