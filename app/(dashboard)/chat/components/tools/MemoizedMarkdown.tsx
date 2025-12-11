/* eslint-disable @next/next/no-img-element */
import { marked } from 'marked';
import { memo, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { Options as HighlightOptions } from 'rehype-highlight';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { encodeBase64 } from '@/utils/base64';
import Image from 'next/image';
import useSWRImmutable from 'swr/immutable';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/components/ui/hover-card';
import { Skeleton } from '@/components/ui/skeleton';

// Function to parse markdown into blocks for memoization
function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

const highlightOptionsAI: HighlightOptions = {
  detect: true,
  prefix: 'hljs-'
};

interface MetadataResponse {
  title: string;
  description: string;
  url: string;
  error?: string;
}
// Fetcher function for useSWR
const fetcher = (url: string): Promise<MetadataResponse> =>
  fetch(url).then((res) => res.json());

// External Link Component with Hovercard
const ExternalLinkWithHovercard = ({
  href,
  children
}: {
  href: string;
  children: React.ReactNode;
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const { data, isLoading } = useSWRImmutable(
    isHovering ? `/api/getmetadata?url=${encodeURIComponent(href)}` : null,
    fetcher
  );

  // Get hostname for display and favicon
  const hostname = useMemo(() => {
    try {
      return new URL(href).hostname.replace(/^www\./, '');
    } catch (e) {
      console.error('Invalid URL:', href, e);
      return '';
    }
  }, [href]);

  // Get favicon URL using Google's favicon service
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;

  return (
    <HoverCard openDelay={300} closeDelay={200}>
      <HoverCardTrigger asChild>
        <Link
          href={`?url=${encodeURIComponent(href)}`}
          scroll={false}
          prefetch={false}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline inline-flex items-center gap-1 group"
          onMouseEnter={() => setIsHovering(true)}
        >
          {children}
          <ExternalLink className="h-3 w-3 opacity-70 group-hover:opacity-100 transition-opacity" />
        </Link>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-0 overflow-hidden border border-border/40 shadow-lg">
        {/* Card Header with gradient background */}
        <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 p-2 border-b border-border/10">
          <div className="flex items-center gap-3">
            {/* Favicon with better styling */}
            <div className="h-10 w-10 overflow-hidden flex-shrink-0 bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center border border-border/20">
              {isLoading ? (
                <Skeleton className="h-10 w-10 rounded" />
              ) : (
                <img
                  src={faviconUrl}
                  alt="Website favicon"
                  className="max-h-10 max-w-10 object-contain"
                  onError={(e) => {
                    // Fallback if favicon fails to load
                    (e.target as HTMLImageElement).src =
                      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWdsb2JlIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxsaW5lIHgxPSIyIiB5MT0iMTIiIHgyPSIyMiIgeTI9IjEyIi8+PHBhdGggZD0iTTEyIDJhMTUuMyAxNS4zIDAgMCAxIDQgMTAgMTUuMyAxNS4zIDAgMCAxLTQgMTAgMTUuMyAxNS4zIDAgMCAxLTQtMTAgMTUuMyAxNS4zIDAgMCAxIDQtMTB6Ii8+PC9zdmc+';
                  }}
                />
              )}
            </div>

            {/* Title and URL with better typography */}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <Skeleton className="h-5 w-40 mb-1" />
              ) : (
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">
                  {data?.title || hostname}
                </h3>
              )}
              <div className="flex items-center gap-1 mt-0.5">
                <span className="inline-flex items-center text-xs text-slate-500 dark:text-slate-400 truncate">
                  <span className="w-3 h-3 mr-1 text-slate-400">
                    <ExternalLink className="h-3 w-3" />
                  </span>
                  {hostname}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Content with description */}
        <div className="p-2 bg-white dark:bg-slate-950">
          {isLoading ? (
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-11/12" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ) : (
            <div>
              {data?.description ? (
                <p className="text-xs leading-normal text-slate-600 dark:text-slate-300 line-clamp-3 p-0">
                  {data.description}
                </p>
              ) : (
                <p className="text-xs italic text-slate-400 dark:text-slate-500">
                  No description available
                </p>
              )}
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
// Memoized component for rendering a single markdown block
const MemoizedMarkdownBlock = memo(
  ({ content }: { content: string }) => {
    const createDocumentLink = (href: string) => {
      // Parse the existing URL parameters
      const params = new URLSearchParams(href.substring(1)); // Remove the leading '?'

      // Get the PDF filename and page number
      const pdfTitle = params.get('pdf');
      const pageNumber = params.get('p');

      // Create new URLSearchParams
      const newSearchParams = new URLSearchParams();

      if (pdfTitle) {
        // Encode the PDF title
        const encodedFilename = encodeURIComponent(encodeBase64(pdfTitle));
        newSearchParams.set('pdf', encodedFilename);
      }

      if (pageNumber) {
        // Keep the page number as is
        newSearchParams.set('p', pageNumber);
      }

      // Construct the final URL
      return `?${newSearchParams.toString()}`;
    };

    return (
      <ReactMarkdown
        components={{
          a: ({ href, children }) => {
            if (href) {
              // Check if the link starts with http:// or https://
              if (href.startsWith('http://') || href.startsWith('https://')) {
                // For web links, return a regular link that opens in a new tab
                return (
                  <ExternalLinkWithHovercard href={href}>
                    {children}
                  </ExternalLinkWithHovercard>
                );
              } else {
                // For document links, use createDocumentLink
                const fullHref = createDocumentLink(href);
                return (
                  <Link
                    href={fullHref}
                    passHref
                    prefetch={false}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    {children}
                    <ExternalLink size={12} className="inline-block ml-0.5" />
                  </Link>
                );
              }
            }
            return (
              <a className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                {children}
              </a>
            );
          },
          // Tables
          table: ({ children }) => (
            <div className="block py-2 overflow-x-auto">
              <table className="w-full border-collapse break-normal text-[0.85rem]">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead>{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => (
            <th
              scope="row"
              className="border border-border p-1 text-left text-[0.9em] break-normal font-semibold hyphens-auto overflow-wrap-normal"
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              scope="row"
              className="border border-border p-1 text-left text-[0.9em] break-normal font-normal hyphens-auto overflow-wrap-normal"
            >
              {children}
            </td>
          ),
          // Paragraphs and text formatting
          p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
          em: ({ children }) => <em className="italic">{children}</em>,
          strong: ({ children }) => (
            <strong className="font-bold">{children}</strong>
          ),
          del: ({ children }) => <del className="line-through">{children}</del>,
          hr: () => <hr className="my-6 border-t border-border" />,
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li className="mb-1">{children}</li>,
          // Headings
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-bold mb-2 mt-4">{children}</h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-sm font-bold mb-2 mt-3">{children}</h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-xs font-bold mb-2 mt-3">{children}</h6>
          ),
          // Block elements
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-border/60 pl-4 italic my-4 text-foreground/80">
              {children}
            </blockquote>
          ),
          // Images
          img: ({ src, alt }) => {
            // Check if src exists and is a string (not a Blob)
            if (typeof src === 'string') {
              return (
                <Image
                  src={src}
                  width={500}
                  height={300}
                  alt={alt || ''}
                  className="max-w-full h-auto my-4 rounded-md"
                />
              );
            }

            // Fallback for cases where src is not a valid string URL
            return (
              <span className="text-destructive">
                [Image with invalid source]
              </span>
            );
          },
          // Code blocks
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className ?? '');
            const language = match?.[1] ? match[1] : '';
            const inline = !language;
            if (inline) {
              return (
                <code
                  className={`bg-muted px-1 py-0.5 rounded ${className}`}
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <div className="relative rounded w-full pt-5 my-2">
                <span className="absolute top-0 left-2 text-xs uppercase text-muted-foreground">
                  {language}
                </span>
                <pre className="m-0 overflow-x-auto bg-muted p-4 rounded-md">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          }
        }}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, highlightOptionsAI]]}
      >
        {content}
      </ReactMarkdown>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if the content has changed
    return prevProps.content === nextProps.content;
  }
);

MemoizedMarkdownBlock.displayName = 'MemoizedMarkdownBlock';

// Component that breaks markdown into blocks and renders each with memoization
export const MemoizedMarkdown = memo(
  ({ content, id }: { content: string; id: string }) => {
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

    return blocks.map((block, index) => (
      <MemoizedMarkdownBlock content={block} key={`${id}-block_${index}`} />
    ));
  }
);

MemoizedMarkdown.displayName = 'MemoizedMarkdown';

export default MemoizedMarkdown;
