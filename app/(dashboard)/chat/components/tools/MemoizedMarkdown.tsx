'use client';
import { marked } from 'marked';
import { memo, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { Options as HighlightOptions } from 'rehype-highlight';
import Link from '@/components/link';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { encodeBase64 } from '@/utils/base64';
import Image from 'next/image';

// Function to parse markdown into blocks for memoization
function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

const highlightOptionsAI: HighlightOptions = {
  detect: true,
  prefix: 'hljs-'
};

// Code Block Component with copy button and line numbers
const CodeBlock = ({
  language,
  code,
  className,
  children
}: {
  language: string;
  code: string;
  className?: string;
  children: React.ReactNode;
}) => {
  const [copied, setCopied] = useState(false);
  const lines = code.split('\n');
  const lineCount = lines.length;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 my-3">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
          {language && (
            <span className="ml-2 text-xs text-zinc-400 uppercase">
              {language}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      <div className="flex overflow-x-auto text-sm">
        {/* Line numbers */}
        <div className="flex-shrink-0 py-4 pl-4 pr-3 text-right select-none border-r border-zinc-800">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="text-zinc-600 leading-relaxed text-xs">
              {i + 1}
            </div>
          ))}
        </div>
        {/* Code content */}
        <pre className="m-0 flex-1 overflow-x-auto">
          <code className={className}>{children}</code>
        </pre>
      </div>
    </div>
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
                // External links open directly in a new tab — no in-app
                // proxy/viewer (SSRF surface) and no metadata endpoint.
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline inline-flex items-center gap-1 group"
                  >
                    {children}
                    <ExternalLink className="h-3 w-3 opacity-70 group-hover:opacity-100 transition-opacity" />
                  </a>
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
                  className={`bg-zinc-800 dark:bg-zinc-800 text-zinc-100 px-1.5 py-0.5 rounded text-sm font-mono ${className}`}
                  {...props}
                >
                  {children}
                </code>
              );
            }

            // Extract text content for copy button
            const getTextContent = (node: React.ReactNode): string => {
              if (typeof node === 'string') return node;
              if (typeof node === 'number') return String(node);
              if (Array.isArray(node)) return node.map(getTextContent).join('');
              if (node && typeof node === 'object' && 'props' in node) {
                const element = node as {
                  props?: { children?: React.ReactNode };
                };
                return getTextContent(element.props?.children);
              }
              return '';
            };
            const codeString = getTextContent(children).replace(/\n$/, '');

            return (
              <CodeBlock
                language={language}
                code={codeString}
                className={className}
              >
                {children}
              </CodeBlock>
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
const MemoizedMarkdown = memo(
  ({ content, id }: { content: string; id: string }) => {
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

    return blocks.map((block, index) => (
      <MemoizedMarkdownBlock content={block} key={`${id}-block_${index}`} />
    ));
  }
);

MemoizedMarkdown.displayName = 'MemoizedMarkdown';

export default MemoizedMarkdown;
