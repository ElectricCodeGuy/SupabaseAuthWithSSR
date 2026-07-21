import React from 'react';
import {
  History,
  Loader2,
  CheckCircle,
  XCircle,
  MessageSquare
} from 'lucide-react';
import type { ToolUIPart } from 'ai';
import type { UITools } from '@/app/(dashboard)/chat/types/tooltypes';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import Link from '@/components/link';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

interface ConversationSearchToolProps {
  toolInvocation: Extract<
    ToolUIPart<UITools>,
    { type: 'tool-conversationSearch' }
  >;
  index: string;
}

export const ConversationSearchTool: React.FC<ConversationSearchToolProps> = ({
  toolInvocation,
  index
}) => {
  const keywords = toolInvocation.input?.keywords ?? [];
  const output =
    toolInvocation.state === 'output-available'
      ? toolInvocation.output
      : undefined;
  const results = output?.results ?? [];

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

  return (
    <Accordion type="single" collapsible className="my-1">
      <AccordionItem
        value={`tool-${index}`}
        className="border rounded-lg shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      >
        <AccordionTrigger className="py-2 px-3 min-h-[36px] hover:no-underline">
          <div className="flex items-center gap-2 w-full">
            <History className="text-primary h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium flex-grow text-left">
              Chat History Search
            </span>
            {output && results.length > 0 && (
              <span className="text-xs mr-2">
                {`${results.length} ${results.length === 1 ? 'conversation' : 'conversations'} found`}
              </span>
            )}
            <div className="flex-shrink-0">{getStatusIcon()}</div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-3 py-2 bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="space-y-3 text-xs">
            {keywords.length > 0 && (
              <div>
                <span className="font-bold text-gray-700 dark:text-gray-300">
                  Keywords:
                </span>{' '}
                <span className="dark:text-gray-400">
                  {keywords.join(', ')}
                </span>
              </div>
            )}

            {(toolInvocation.state === 'input-streaming' ||
              toolInvocation.state === 'input-available') && (
              <p className="italic dark:text-gray-400">
                Searching past conversations…
              </p>
            )}

            {toolInvocation.state === 'output-error' && (
              <p className="text-red-600 dark:text-red-400">
                <span className="font-bold">Error:</span>{' '}
                <span>{toolInvocation.errorText || 'Search failed'}</span>
              </p>
            )}

            {output && results.length === 0 && (
              <p className="dark:text-gray-400">{output.message}</p>
            )}

            {results.length > 0 && (
              <div className="space-y-2">
                {results.map((result) => (
                  <div
                    key={result.conversationId}
                    className="p-2 rounded-md bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                  >
                    <Link
                      href={result.link}
                      className="group flex items-start gap-2 hover:no-underline"
                      prefetch={false}
                    >
                      <MessageSquare className="h-3 w-3 mt-0.5 text-gray-400 group-hover:text-primary flex-shrink-0" />
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary truncate flex-grow">
                            {result.title}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">
                            {format(new Date(result.date), 'PP', {
                              locale: enUS
                            })}
                          </span>
                        </div>
                        {result.snippets[0] && (
                          <p className="text-gray-500 dark:text-gray-400 line-clamp-2">
                            {result.snippets[0]}
                          </p>
                        )}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
