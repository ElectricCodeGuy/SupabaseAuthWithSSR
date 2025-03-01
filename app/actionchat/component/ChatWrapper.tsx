'use client';
import React, { useState } from 'react';
import type { StreamableValue } from 'ai/rsc';
import { useStreamableValue } from 'ai/rsc';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import type { Options as HighlightOptions } from 'rehype-highlight';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Bot,
  Copy,
  CheckCircle,
  Globe,
  ExternalLink,
  Link as LinkIcon
} from 'lucide-react';
import { encodeBase64 } from '../lib/base64';

const highlightOptionsAI: HighlightOptions = {
  detect: true,
  prefix: 'hljs-'
};

export function UserMessage({
  children,
  full_name
}: {
  children: React.ReactNode;
  full_name: string;
}) {
  return (
    <div
      className={cn(
        'relative bg-[#daf8cb] text-[#203728] pt-8 pb-4 rounded-lg',
        'm-[2px_0] ml-1 flex-grow overflow-hidden px-4',
        'self-end break-words flex flex-col items-start shadow-md'
      )}
    >
      <span className="text-xs font-bold absolute top-0 left-[10px] w-full whitespace-nowrap overflow-hidden text-ellipsis">
        {full_name}
      </span>
      <ReactMarkdown>{children?.toString()}</ReactMarkdown>
    </div>
  );
}

export function BotMessage({
  children,
  textStream,
  className
}: {
  children?: React.ReactNode;
  textStream?: StreamableValue;
  className?: string;
}) {
  const [text] = useStreamableValue(textStream);
  const content = text
    ? text
    : typeof children === 'string'
    ? children
    : children;
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = (str: string) => {
    window.navigator.clipboard.writeText(str);
  };

  const handleCopy = (content: string) => {
    copyToClipboard(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1000);
  };

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
    <div
      className={cn(
        'relative bg-[#f0f0f0] text-[#2c3e50] rounded-lg my-2',
        'self-start break-words flex flex-col items-start shadow-md p-6',
        className
      )}
    >
      <div className="absolute top-[10px] left-[10px]">
        <Bot className="text-[#607d8b]" size={20} />
      </div>
      <div
        className="absolute top-[5px] right-[5px] cursor-pointer flex items-center justify-center w-6 h-6"
        onClick={() => handleCopy(content || '')}
      >
        {isCopied ? <CheckCircle size={16} /> : <Copy size={16} />}
      </div>

      <ReactMarkdown
        components={{
          table: ({ children }) => (
            <div className="block py-2">
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
              className="border border-[#ddd] p-1 text-left text-[0.9em] break-normal font-normal hyphens-auto overflow-wrap-normal"
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              scope="row"
              className="border border-[#ddd] p-1 text-left text-[0.9em] break-normal font-normal hyphens-auto overflow-wrap-normal"
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
            <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4">
              {children}
            </blockquote>
          ),
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className ?? '');
            const language = match?.[1] ? match[1] : '';
            const inline = !language;
            if (inline) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <div
                style={{
                  position: 'relative',
                  borderRadius: '5px',
                  padding: '20px',
                  marginTop: '20px',
                  maxWidth: '100%' // Ensure the container fits its parent
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '0',
                    left: '5px',
                    fontSize: '0.8em',
                    textTransform: 'uppercase'
                  }}
                >
                  {language}
                </span>
                <div
                  style={{
                    overflowX: 'auto', // Enable horizontal scrolling
                    maxWidth: '650px' // Set a fixed maximum width
                  }}
                >
                  <pre style={{ margin: '0' }}>
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              </div>
            );
          },
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
                    className="text-blue-600 hover:underline"
                  >
                    {children}
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
                    className="text-blue-600 hover:underline"
                  >
                    {children}
                  </Link>
                );
              }
            }
            return <a className="text-blue-600 hover:underline">{children}</a>;
          }
        }}
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeHighlight, highlightOptionsAI]]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

interface SearchResult {
  title: string;
  url: string;
}

export const InternetSearchToolResults = ({
  searchResults
}: {
  searchResults: SearchResult[];
}) => {
  return (
    <>
      <h6 className="mb-2 text-primary font-semibold text-center border-b-2 border-primary-light pb-1">
        📚 Reference Sources ({searchResults.length})
      </h6>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 justify-center">
        {searchResults.map((result, index) => {
          const domain = new URL(result.url).hostname.replace('www.', '');

          return (
            <div
              key={index}
              className="p-2 h-full flex flex-col gap-2 rounded-lg transition-all duration-300 
                       bg-background shadow-md hover:-translate-y-0.5 hover:shadow-lg group"
            >
              <div className="flex-1">
                <Link
                  href={`?url=${encodeURIComponent(result.url)}`}
                  scroll={false}
                  className="flex items-start gap-1 text-[0.95rem] font-medium text-foreground 
                           no-underline leading-tight transition-colors duration-200 group-hover:text-primary"
                >
                  <LinkIcon
                    className="text-primary mt-[0.3rem] flex-shrink-0"
                    size={18}
                  />
                  <span className="line-clamp-2 overflow-hidden text-ellipsis w-full">
                    {result.title}
                  </span>
                </Link>
              </div>

              <div
                className="flex flex-row justify-between items-center pt-1 
                         border-t border-gray-200 mt-auto"
              >
                <span className="flex items-center gap-0.5 text-muted-foreground text-xs">
                  <Globe size={16} />
                  {domain}
                </span>

                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary p-1 rounded-full hover:bg-primary/10"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
