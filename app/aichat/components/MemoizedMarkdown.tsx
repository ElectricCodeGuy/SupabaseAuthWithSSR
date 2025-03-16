import React, { useState } from 'react';
import { type Message } from '@ai-sdk/react';
import type { Options as HighlightOptions } from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { User, Bot, Copy, CheckCircle, ExternalLink } from 'lucide-react';
import { marked } from 'marked';
import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import Link from 'next/link';

// Import Shadcn UI accordion components
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';

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
    return (
      <ReactMarkdown
        components={{
          a: ({ href, children }) => (
            <Link
              href={`?url=${encodeURIComponent(href || '')}`}
              scroll={false}
              prefetch={false}
              className="text-primary hover:text-primary/80 underline decoration-primary/30 hover:decoration-primary/100 transition-colors inline-flex items-center gap-0.5"
            >
              {children}
              <ExternalLink size={12} className="inline-block ml-0.5" />
            </Link>
          ),
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

interface ChatMessageProps {
  messages: Message[];
}

const MessageComponent = ({ message }: { message: Message }) => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = (str: string) => {
    window.navigator.clipboard.writeText(str);
  };

  const handleCopy = (content: string) => {
    copyToClipboard(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1000);
  };

  // Extract sources from message parts
  const sources = message.parts
    ?.filter((part) => part.type === 'source')
    .map((part) => part.source);

  // Extract reasoning from message parts
  const reasoningParts = message.parts?.filter(
    (part) => part.type === 'reasoning'
  );

  return (
    <li
      className={`relative flex flex-col items-start m-2 rounded-lg shadow-md p-4 break-words ${
        message.role === 'user'
          ? 'bg-primary/10 text-foreground dark:bg-primary/20'
          : 'bg-card text-card-foreground'
      }`}
    >
      <div className="absolute top-2 left-2">
        {message.role === 'user' ? (
          <User className="text-primary" size={20} />
        ) : (
          <Bot className="text-muted-foreground" size={20} />
        )}
      </div>

      {message.role === 'assistant' && (
        <button
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => handleCopy(message.content)}
        >
          {isCopied ? <CheckCircle size={18} /> : <Copy size={18} />}
        </button>
      )}

      <div className="w-full pt-6">
        {message.role === 'user' ? (
          <MemoizedMarkdown
            content={message.content}
            id={`user-${message.id}`}
          />
        ) : (
          <>
            <MemoizedMarkdown
              content={message.content}
              id={`assistant-${message.id}`}
            />

            {/* Reasoning section with Shadcn UI accordion - default open */}
            {reasoningParts && reasoningParts.length > 0 && (
              <div className="mt-4 pt-2 border-t border-border/40">
                <Accordion
                  type="single"
                  defaultValue="reasoning"
                  collapsible
                  className="w-full"
                >
                  <AccordionItem
                    value="reasoning"
                    className="bg-background/40 rounded-lg overflow-hidden border border-border shadow-sm"
                  >
                    <AccordionTrigger className="font-bold text-foreground/80 hover:text-foreground py-2 px-3 cursor-pointer">
                      Reasoning
                    </AccordionTrigger>
                    <AccordionContent className="bg-muted/50 p-3 text-sm text-foreground/90 overflow-x-auto max-h-[300px] overflow-y-auto border-t border-border/40">
                      {reasoningParts.map((part, index) => {
                        // Extract text from details
                        const reasoningText = part.details
                          ?.map((detail) =>
                            detail.type === 'text' ? detail.text : '<redacted>'
                          )
                          .join('');

                        return (
                          <div key={index}>
                            <MemoizedMarkdown
                              content={reasoningText}
                              id={`reasoning-${message.id}-${index}`}
                            />
                          </div>
                        );
                      })}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}

            {/* Sources section */}
            {sources && sources.length > 0 && (
              <div className="mt-4 pt-2 border-t border-border/40">
                <h6 className="font-bold text-foreground/80">Sources:</h6>
                <ul className="space-y-1 mt-2">
                  {sources.map((source, index) => (
                    <li key={index} className="py-0.5">
                      {source.url && (
                        <Link
                          href={`?url=${encodeURIComponent(source.url)}`}
                          scroll={false}
                          prefetch={false}
                          className="text-sm text-primary hover:text-primary/80 underline decoration-primary/30 hover:decoration-primary/100 transition-colors inline-flex items-center gap-0.5 px-2 py-1 rounded-md hover:bg-primary/5"
                        >
                          <ExternalLink
                            size={14}
                            className="mr-1 flex-shrink-0"
                          />
                          <span className="break-all">{source.url}</span>
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </li>
  );
};

const ChatMessage: React.FC<ChatMessageProps> = ({ messages }) => {
  return (
    <>
      {messages.map((message, index) => (
        <MessageComponent key={`${message.id}-${index}`} message={message} />
      ))}
    </>
  );
};

export default ChatMessage;
