// app/chat/components/tools/WebsiteChatTool.tsx
import React, { useState } from 'react';
import { Globe, CheckCircle, ExternalLink, Search, ChevronDown } from 'lucide-react';
import type { ToolUIPart } from 'ai';
import type { UITools } from '@/app/chat/types/tooltypes';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface WebsiteSearchToolProps {
  toolInvocation: Extract<
    ToolUIPart<UITools>,
    { type: 'tool-websiteSearchTool' }
  >;
}

const WebsiteSearchTool: React.FC<WebsiteSearchToolProps> = ({
  toolInvocation
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const query = toolInvocation.input?.query || '';
  const toolOutput = toolInvocation.output?.toolOutput;

  const toolHeader = (
    <div className="flex items-center gap-2">
      <Globe className="text-primary" size={18} />
      <span className="text-sm font-medium text-foreground">Web Search</span>
    </div>
  );

  switch (toolInvocation.state) {
    case 'input-streaming':
      return (
        <div className="my-1 p-2 bg-muted/30 rounded-md border border-border/50">
          {toolHeader}
          <div className="flex items-center gap-2 mt-2">
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-xs text-muted-foreground">
              Preparing search...
            </span>
          </div>
        </div>
      );

    case 'input-available':
      return (
        <div className="my-1 p-2 bg-muted/30 rounded-md border border-border/50">
          {toolHeader}
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
          {toolHeader}
          <div className="flex items-center gap-2 mt-2">
            <CheckCircle
              size={16}
              className="text-green-600 dark:text-green-400"
            />
            <span className="text-xs text-green-700 dark:text-green-400">
              Search completed
            </span>
          </div>

          {/* Display sources if available */}
          {toolOutput?.sources && toolOutput.sources.length > 0 && (
            <Collapsible
              open={isOpen}
              onOpenChange={setIsOpen}
              className="mt-3"
            >
              <CollapsibleTrigger className="flex items-center gap-2 text-xs font-medium text-foreground/70 hover:text-foreground transition-colors">
                <ChevronDown
                  size={14}
                  className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
                {toolOutput.sources.length} source
                {toolOutput.sources.length > 1 ? 's' : ''} found
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 space-y-2">
                  {/* Show queries used */}
                  {toolOutput.queriesUsed &&
                    toolOutput.queriesUsed.length > 0 && (
                      <div className="p-2 bg-muted/20 rounded-md">
                        <div className="flex items-center gap-1 mb-1">
                          <Search
                            size={12}
                            className="text-muted-foreground"
                          />
                          <span className="text-xs font-medium text-muted-foreground">
                            Search queries:
                          </span>
                        </div>
                        <ul className="list-disc list-inside">
                          {toolOutput.queriesUsed.map((q, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-foreground/60 ml-2"
                            >
                              {q}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Show sources */}
                  <div className="space-y-1">
                    {toolOutput.sources.map((source, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-background/50 rounded-md border border-border/50 hover:bg-background/70 transition-colors"
                      >
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-2 text-xs"
                        >
                          <ExternalLink
                            size={12}
                            className="text-primary mt-0.5 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground/80 line-clamp-2">
                              {source.title}
                            </div>
                            <div className="text-muted-foreground truncate mt-0.5">
                              {source.url}
                            </div>
                          </div>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Original query display */}
          {query && !toolOutput?.sources && (
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
          {toolHeader}
          <div className="flex items-center gap-2 mt-2">
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

export default WebsiteSearchTool;