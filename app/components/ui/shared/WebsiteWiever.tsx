'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface WebsiteViewerProps {
  url: string;
}

const WebsiteViewer: React.FC<WebsiteViewerProps> = ({ url }) => {
  const getProxiedUrl = (url: string) => {
    if (url.toLowerCase().includes('pdf')) {
      return `/api/proxy-pdf?url=${encodeURIComponent(url)}`;
    }
    return `/api/proxy-website?url=${encodeURIComponent(url)}`;
  };
  const pathname = usePathname();

  // Note: Not all websites can be proxied due to security restrictions.
  // If the website does some sort of POST request after render to get the data, it is not possible to proxy it with this technique.
  // Im also not sure if this might cause some legal issues... So use it at your own risk.
  return (
    <div className="w-1/2 overflow-y-auto h-[calc(100vh-48px)] border-l border-border relative flex flex-col">
      <div className="h-10 border-b border-border flex items-center px-2 bg-background">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                variant="outline"
                size="icon"
                className="m-0.5 rounded-md p-1 h-7 w-7 bg-background text-foreground transition-all duration-200 
                         hover:-translate-y-[1px] hover:bg-background hover:shadow-md hover:text-primary hover:border-primary"
              >
                <Link href={pathname} replace prefetch={false}>
                  <X className="h-4 w-4 font-bold" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Close</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          title={url}
          className="ml-2 flex items-center text-primary hover:text-primary/80 transition-colors no-underline hover:underline"
        >
          <span className="max-w-[400px] overflow-hidden text-ellipsis whitespace-nowrap text-sm">
            {url}
          </span>
          <ExternalLink className="ml-0.5 h-4 w-4" />
        </a>
      </div>
      <div className="flex-1 bg-background/50">
        <iframe
          src={getProxiedUrl(url)}
          className="w-full h-full border-none"
          title="Website Viewer"
        />
      </div>
    </div>
  );
};

export default WebsiteViewer;
