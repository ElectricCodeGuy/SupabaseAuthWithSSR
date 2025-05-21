'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, Info, AlertCircle } from 'lucide-react';
import type { LanguageModelV1Source } from '@ai-sdk/provider';
import useSWR from 'swr';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';

interface SourceViewProps {
  sources: LanguageModelV1Source[];
}

interface Metadata {
  title: string;
  description: string;
  url: string;
}

// Simple fetcher for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Helper function to get domain from URL
const getDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    console.error('Invalid URL:', url, e);
    return '';
  }
};

const SourceItem = ({
  source,
  index
}: {
  source: LanguageModelV1Source;
  index: number;
}) => {
  // useSWR hook at the top level
  const { data, error, isLoading } = useSWR<Metadata>(
    source.url
      ? `/api/getmetadata?url=${encodeURIComponent(source.url)}`
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (!source.url) return null;

  // Determine the link title with fallback logic
  const linkTitle = source.title || data?.title || source.url;

  // Get domain for favicon
  const domain = getDomain(source.url);
  const faviconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    : null;

  return (
    <li
      className={`p-2 mt-2 rounded-md ${
        index % 2 === 0
          ? 'bg-muted/40'
          : 'bg-background border border-border/30'
      }`}
    >
      <div className="flex items-start">
        <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 mr-2 text-xs font-bold">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            {faviconUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={faviconUrl}
                alt=""
                className="w-4 h-4 mr-2 flex-shrink-0"
                onError={(e) => {
                  // Hide favicon if it fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <Link
              href={`?url=${encodeURIComponent(source.url)}`}
              scroll={false}
              prefetch={false}
              className="text-sm text-primary hover:text-primary/80 underline decoration-primary/30 hover:decoration-primary/100 transition-colors inline-flex items-center gap-0.5 rounded-md hover:bg-primary/5"
            >
              <ExternalLink size={14} className="mr-1 flex-shrink-0" />
              <span className="font-medium">{linkTitle}</span>
            </Link>
          </div>

          <div className="text-xs text-muted-foreground mt-0.5 truncate pl-6">
            {domain}
          </div>

          {isLoading && (
            <div className="text-xs mt-1 text-muted-foreground pl-6">
              Loading metadata...
            </div>
          )}

          {error && (
            <div className="text-xs mt-1 text-destructive flex items-center pl-6">
              <AlertCircle size={10} className="mr-1" />
              Failed to load metadata
            </div>
          )}

          {data && !isLoading && !error && data.description && (
            <div className="mt-1 border-l-2 border-primary/30 pl-2 ml-3">
              <p className="text-xs text-muted-foreground">
                {data.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </li>
  );
};

const SourceView: React.FC<SourceViewProps> = ({ sources }) => {
  const validSources = sources?.filter((s) => s.url) || [];

  if (validSources.length === 0) return null;

  return (
    <>
      <Separator className="mb-3" />

      <Accordion type="single" collapsible defaultValue="">
        <AccordionItem value="sources" className="border-none">
          <AccordionTrigger className="py-1 px-0">
            <div className="font-bold text-foreground/80 flex items-center">
              <Info size={14} className="mr-1.5" />
              Sources ({validSources.length})
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-0 mt-2 list-none">
              {validSources.map((source, index) => (
                <SourceItem
                  key={`source-${index}`}
                  source={source}
                  index={index}
                />
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  );
};

export default SourceView;
