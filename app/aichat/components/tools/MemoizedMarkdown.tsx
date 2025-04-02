import { marked } from 'marked';
import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import type { Options as HighlightOptions } from 'rehype-highlight';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { encodeBase64 } from '../../lib/base64';

// Function to parse markdown into blocks for memoization
function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

const highlightOptionsAI: HighlightOptions = {
  detect: true,
  prefix: 'hljs-'
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
                  <Link
                    href={`?url=${encodeURIComponent(href)}`}
                    scroll={false}
                    prefetch={false}
                    className="text-primary hover:underline"
                  >
                    {children}
                    <ExternalLink size={12} className="inline-block ml-0.5" />
                  </Link>
                );
              } else {
                // For document links, use createDocumentLink
                const fullHref = createDocumentLink(href);
                return (
                  <Link
                    href={fullHref}
                    passHref
                    prefetch={false}
                    className="text-primary hover:underline"
                  >
                    {children}
                    <ExternalLink size={12} className="inline-block ml-0.5" />
                  </Link>
                );
              }
            }
            return <a className="text-primary hover:underline">{children}</a>;
          },
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
              className="border border-border p-1 text-left text-[0.9em] break-normal font-normal hyphens-auto overflow-wrap-normal"
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
          p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc pl-6 mb-4">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 mb-4">{children}</ol>
          ),
          li: ({ children }) => <li className="mb-1">{children}</li>,
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-border/60 pl-4 italic my-4">
              {children}
            </blockquote>
          ),
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
        remarkPlugins={[remarkGfm, remarkMath]}
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
