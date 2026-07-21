import React from 'react';
import { Brain, Loader2, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import type { ToolUIPart } from 'ai';
import type { UITools } from '@/app/(dashboard)/chat/types/tooltypes';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';

interface MemoryToolProps {
  toolInvocation: Extract<ToolUIPart<UITools>, { type: 'tool-saveMemory' }>;
  index: string;
}

const ACTION_LABELS: Record<string, string> = {
  save: 'Saving memory',
  list: 'Listing memories',
  delete: 'Deleting memory'
};

export const MemoryTool: React.FC<MemoryToolProps> = ({
  toolInvocation,
  index
}) => {
  const action = toolInvocation.input?.action;
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

  const getStatusIcon = () => {
    if (isLoading) {
      return (
        <Loader2 className="h-4 w-4 animate-spin text-gray-600 dark:text-gray-400" />
      );
    }
    if (failed) {
      return <XCircle className="h-4 w-4 text-red-500 dark:text-red-400" />;
    }
    return (
      <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
    );
  };

  return (
    <Accordion type="single" collapsible className="my-1">
      <AccordionItem
        value={`tool-${index}`}
        className="border rounded-lg shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      >
        <AccordionTrigger className="py-2 px-3 min-h-[36px] hover:no-underline">
          <div className="flex items-center gap-2 w-full">
            <Brain className="text-primary h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium flex-grow text-left">
              {(action && ACTION_LABELS[action]) || 'Memory'}
            </span>
            <div className="flex-shrink-0">{getStatusIcon()}</div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-3 py-2 bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="space-y-2 text-xs">
            {isLoading && (
              <p className="italic dark:text-gray-400">Updating memory…</p>
            )}

            {toolInvocation.state === 'output-error' && (
              <p className="text-red-600 dark:text-red-400">
                <span className="font-bold">Error:</span>{' '}
                <span>{toolInvocation.errorText || 'Memory operation failed'}</span>
              </p>
            )}

            {output && (
              <>
                <p
                  className={
                    output.success
                      ? 'text-gray-700 dark:text-gray-300'
                      : 'text-red-600 dark:text-red-400'
                  }
                >
                  {output.message}
                </p>

                {'memory' in output && output.memory && (
                  <p className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-2 text-gray-700 dark:text-gray-300">
                    {output.memory.content}
                  </p>
                )}

                {'memories' in output && output.memories && (
                  <ul className="space-y-1">
                    {output.memories.map((m) => (
                      <li
                        key={m.id}
                        className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-2 text-gray-700 dark:text-gray-300"
                      >
                        {m.content}
                      </li>
                    ))}
                  </ul>
                )}

                {'deletedId' in output && output.deletedId && (
                  <p className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <Trash2 className="h-3 w-3" /> Memory removed.
                  </p>
                )}
              </>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
