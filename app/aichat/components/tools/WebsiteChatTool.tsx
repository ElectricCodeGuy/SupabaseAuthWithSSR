import React from 'react';
import { Globe, CheckCircle } from 'lucide-react';
import { type ToolInvocation } from 'ai';
import type { WebsiteSearchArgs } from '@/app/aichat/types/tooltypes';

interface WebsiteSearchToolProps {
  toolInvocation: ToolInvocation;
}

const WebsiteSearchTool: React.FC<WebsiteSearchToolProps> = ({
  toolInvocation
}) => {
  const args = (toolInvocation.args as WebsiteSearchArgs) || { query: '' };
  const query = args.query || '';

  const toolHeader = (
    <div className="flex items-center gap-2">
      <Globe className="text-primary" size={18} />
      <span className="text-sm font-medium text-foreground">Web Search</span>
    </div>
  );

  switch (toolInvocation.state) {
    case 'partial-call':
    case 'call':
      return (
        <div className="my-1 p-2 bg-muted/30 rounded-md">
          {toolHeader}
          <div className="flex items-center gap-2 mt-2">
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-xs text-muted-foreground">Searching...</span>
          </div>
          {query && (
            <div className="mt-2">
              <span
                className={`text-xs ${
                  toolInvocation.state === 'call' ? 'font-bold' : 'font-normal'
                } text-muted-foreground`}
              >
                Search query: {query}
              </span>
            </div>
          )}
        </div>
      );

    case 'result':
      return (
        <div className="my-1 p-2 bg-blue-50/70 rounded-md border border-blue-100">
          {toolHeader}
          <div className="flex items-center gap-2 mt-2">
            <CheckCircle size={16} className="text-green-500" />
            <span className="text-xs text-green-600">Search completed</span>
          </div>
          {query && (
            <div className="mt-1">
              <span className="text-xs text-muted-foreground">
                Search query: {query}
              </span>
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
};

export default WebsiteSearchTool;
