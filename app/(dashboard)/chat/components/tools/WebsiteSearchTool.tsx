// app/chat/component/ChatComponent/tools/WebsiteSearchTool.tsx
import React from 'react';
import {
  Globe,
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink
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
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

interface WebsiteSearchToolProps {
  toolInvocation: Extract<
    ToolUIPart<UITools>,
    { type: 'tool-websiteSearchTool' }
  >;
  index: string;
}

export const WebsiteSearchTool: React.FC<WebsiteSearchToolProps> = ({
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
        return 'bg-[rgba(240,249,255,0.7)] dark:bg-blue-950/40 border-[rgba(0,127,255,0.1)] dark:border-blue-800/30';
      case 'output-error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  // Extract sources from output context
  const getSources = () => {
    if (!output?.context || !Array.isArray(output.context)) return [];

    return output.context.filter((item) => item.type === 'website');
  };

  const sources = getSources();

  return (
    <Accordion type="single" collapsible className="my-1">
      <AccordionItem
        value={`tool-${index}`}
        className={`border rounded-lg shadow-sm ${getBackgroundClass()}`}
      >
        <AccordionTrigger className="py-2 px-3 min-h-[36px] hover:no-underline">
          <div className="flex items-center gap-2 w-full">
            <div className="flex-shrink-0">
              <Globe className="text-primary h-5 w-5" />
            </div>
            <span className="text-sm font-medium flex-grow text-left">
              Web Search
            </span>
            {sources.length > 0 &&
              toolInvocation.state === 'output-available' && (
                <span className="text-xs mr-2">
                  {sources.length} {sources.length === 1 ? 'source' : 'sources'}{' '}
                  found
                </span>
              )}
            <div className="flex-shrink-0">{getStatusIcon()}</div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-3 py-2 bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="space-y-3">
            {/* Status */}

            {/* Query */}
            {query && (
              <div className="text-xs">
                <span className="font-bold text-gray-700 dark:text-gray-300">
                  Search query:
                </span>{' '}
                <span className="dark:text-gray-400">{query}</span>
              </div>
            )}

            {/* Sources */}
            {toolInvocation.state === 'output-available' &&
              sources.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Found sources:
                  </div>
                  <div className="space-y-2">
                    {sources.map((source, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-md bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                      >
                        <Link
                          href={`?url=${source.url}`}
                          className="group flex items-start gap-2 hover:no-underline"
                          prefetch={false}
                        >
                          <ExternalLink className="h-3 w-3 mt-0.5 text-gray-400 group-hover:text-primary flex-shrink-0" />
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="text-xs font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary truncate flex-grow">
                                {source.title}
                              </div>
                              {source.publishedDate && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                  {format(
                                    new Date(source.publishedDate),
                                    'PPP',
                                    { locale: enUS }
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {source.url}
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Loading state */}
            {(toolInvocation.state === 'input-streaming' ||
              toolInvocation.state === 'input-available') && (
              <div className="text-xs dark:text-gray-400 italic">
                Searching for relevant sources...
              </div>
            )}

            {/* Error */}
            {toolInvocation.state === 'output-error' && (
              <div className="text-xs text-red-600 dark:text-red-400">
                <span className="font-bold">Error:</span>{' '}
                {toolInvocation.errorText || 'Search failed'}
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
