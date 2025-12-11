import React from 'react';
import {
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  FileIcon
} from 'lucide-react';
import type { ToolUIPart } from 'ai';
import type { UITools } from '@/app/(dashboard)/chat/types/tooltypes';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import Link from 'next/link';

// Client-side base64 encoding for URLs
function encodeBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

interface DocumentChatToolProps {
  toolInvocation: Extract<
    ToolUIPart<UITools>,
    { type: 'tool-searchUserDocument' }
  >;
  index: string;
}

const DocumentChatTool: React.FC<DocumentChatToolProps> = ({
  toolInvocation,
  index
}) => {
  const query = toolInvocation.input?.query || '';
  const output = toolInvocation.output;

  // Determine status icon based on state
  const getStatusIcon = () => {
    switch (toolInvocation.state) {
      case 'input-streaming':
      case 'input-available':
        return (
          <Loader2 className="h-4 w-4 animate-spin text-gray-600 dark:text-gray-400" />
        );
      case 'output-available':
        return (
          <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
        );
      case 'output-error':
        return <XCircle className="h-4 w-4 text-red-500 dark:text-red-400" />;
      default:
        return null;
    }
  };

  // Determine background color based on state
  const getBackgroundClass = () => {
    switch (toolInvocation.state) {
      case 'output-available':
        return 'bg-[rgba(240,255,240,0.7)] dark:bg-green-950/40 border-[rgba(0,200,0,0.1)] dark:border-green-800/30';
      case 'output-error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  // Extract document sources from output context
  const getSources = () => {
    if (!output?.context || !Array.isArray(output.context)) return [];
    return output.context.filter((item: any) => item.type === 'document');
  };

  // Group sources by document title
  const getGroupedSources = () => {
    const sources = getSources();
    const grouped: Record<string, typeof sources> = {};

    for (const source of sources) {
      const key = source.title;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(source);
    }

    return Object.entries(grouped).map(([title, pages]) => ({
      title,
      aiTitle: pages[0]?.aiTitle,
      pages: pages.sort((a, b) => a.page - b.page),
      totalPages: pages[0]?.totalPages
    }));
  };

  const sources = getSources();
  const groupedSources = getGroupedSources();

  return (
    <Accordion type="single" collapsible className="my-1">
      <AccordionItem
        value={`tool-${index}`}
        className={`border rounded-lg shadow-sm ${getBackgroundClass()}`}
      >
        <AccordionTrigger className="py-2 px-3 min-h-[36px] hover:no-underline">
          <div className="flex items-center gap-2 w-full">
            <div className="flex-shrink-0">
              <FileText className="text-primary h-5 w-5" />
            </div>
            <span className="text-sm font-medium flex-grow text-left">
              Søgning i dokumenter
            </span>
            {sources.length > 0 &&
              toolInvocation.state === 'output-available' && (
                <span className="text-xs mr-2">
                  {groupedSources.length}{' '}
                  {groupedSources.length === 1 ? 'dokument' : 'dokumenter'},{' '}
                  {sources.length} {sources.length === 1 ? 'side' : 'sider'}
                </span>
              )}
            <div className="flex-shrink-0">{getStatusIcon()}</div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-3 py-2 bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="space-y-3">
            {/* Query */}
            {query && (
              <div className="text-xs">
                <span className="font-bold text-gray-700 dark:text-gray-300">
                  Søgeord:
                </span>{' '}
                <span className="dark:text-gray-400">{query}</span>
              </div>
            )}

            {/* Document Sources */}
            {toolInvocation.state === 'output-available' &&
              groupedSources.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Fundne dokumenter:
                  </div>
                  <div className="space-y-2">
                    {groupedSources.map((doc, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-md bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start gap-2">
                          <FileIcon className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                          <div className="flex-grow min-w-0">
                            <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                              {doc.aiTitle || doc.title}
                            </div>
                            {doc.aiTitle && doc.aiTitle !== doc.title && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {doc.title}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {doc.pages.slice(0, 10).map((page, pageIdx) => (
                                <Link
                                  key={pageIdx}
                                  href={`?pdf=${encodeBase64(doc.title)}&p=${page.page}`}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                  prefetch={false}
                                >
                                  s. {page.page}
                                </Link>
                              ))}
                              {doc.pages.length > 10 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 px-1">
                                  +{doc.pages.length - 10} flere
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* No documents found */}
            {toolInvocation.state === 'output-available' &&
              sources.length === 0 && (
                <div className="text-xs text-gray-600 dark:text-gray-400 italic">
                  Ingen relevante dokumenter fundet
                </div>
              )}

            {/* Loading state */}
            {(toolInvocation.state === 'input-streaming' ||
              toolInvocation.state === 'input-available') && (
              <div className="text-xs dark:text-gray-400 italic">
                Søger i dine dokumenter...
              </div>
            )}

            {/* Error */}
            {toolInvocation.state === 'output-error' && (
              <div className="text-xs text-red-600 dark:text-red-400">
                <span className="font-bold">Fejl:</span>{' '}
                {toolInvocation.errorText || 'Søgning fejlede'}
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default DocumentChatTool;
