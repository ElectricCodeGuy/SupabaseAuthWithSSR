'use client';
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link as MuiLink
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight, { Options as HighlightOptions } from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import Link from 'next/link';
import {
  Android as AndroidIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
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
    <Box
      sx={{
        position: 'relative',
        background: '#daf8cb',
        color: '#203728',
        pt: 2,
        borderRadius: '8px',
        margin: '8px 0',
        alignSelf: 'flex-end',
        wordBreak: 'break-word',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
      }}
    >
      <Box
        sx={{
          position: 'relative'
        }}
      >
        <Typography
          variant="caption"
          sx={{
            width: 'fit-content',
            fontWeight: 'bold',
            position: 'absolute',
            top: -15,
            left: '10px'
          }}
        >
          {full_name}
        </Typography>
        <Box
          sx={{
            ml: 2,
            flexGrow: 1,
            overflow: 'hidden',
            px: 1
          }}
        >
          <ReactMarkdown>{children?.toString()}</ReactMarkdown>
        </Box>
      </Box>
    </Box>
  );
}
export function BotMessage({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = (str: string): void => {
    void window.navigator.clipboard.writeText(str);
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
    <Box
      sx={{
        position: 'relative',
        background: '#f0f0f0',
        color: '#2c3e50',
        pt: 2,
        borderRadius: '8px',
        margin: '8px 0',
        alignSelf: 'flex-start',
        wordBreak: 'break-word',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
      }}
      className={className}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '10px',
          left: '10px'
        }}
      >
        <AndroidIcon sx={{ color: '#607d8b' }} />
      </Box>
      <Box
        sx={{
          position: 'absolute',
          top: '5px',
          right: '5px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
          height: 24
        }}
        onClick={() => handleCopy(children?.toString() || '')}
      >
        {isCopied ? (
          <CheckCircleIcon fontSize="inherit" />
        ) : (
          <ContentCopyIcon fontSize="inherit" />
        )}
      </Box>
      <Box
        sx={{
          ml: 2,
          flexGrow: 1,
          overflow: 'hidden',
          px: 1
        }}
      >
        <ReactMarkdown
          components={{
            table: ({ children }) => (
              <Box
                sx={{
                  display: 'block',
                  '& table': {
                    width: '100%',
                    borderCollapse: 'collapse',
                    wordBreak: 'normal',
                    fontSize: '0.85rem'
                  }
                }}
              >
                <TableContainer>
                  <Table size="small">{children}</Table>
                </TableContainer>
              </Box>
            ),
            thead: ({ children }) => <TableHead>{children}</TableHead>,
            tbody: ({ children }) => <TableBody>{children}</TableBody>,
            tr: ({ children }) => <TableRow>{children}</TableRow>,
            th: ({ children }) => (
              <TableCell
                component="th"
                size="small"
                scope="row"
                sx={{
                  border: '1px solid #ddd',
                  padding: '4px',
                  textAlign: 'left',
                  fontSize: '0.9em',
                  wordBreak: 'normal',
                  fontWeight: 'normal',
                  hyphens: 'auto',
                  overflowWrap: 'normal'
                }}
              >
                {children}
              </TableCell>
            ),
            td: ({ children }) => (
              <TableCell
                scope="row"
                size="small"
                sx={{
                  border: '1px solid #ddd',
                  padding: '4px',
                  textAlign: 'left',
                  fontSize: '0.9em',
                  wordBreak: 'normal',
                  fontWeight: 'normal',
                  hyphens: 'auto',
                  overflowWrap: 'normal'
                }}
              >
                {children}
              </TableCell>
            ),
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const language = match && match[1] ? match[1] : '';
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
                // Handle PDF links

                const fullHref = createDocumentLink(href);
                return (
                  <Link href={fullHref} passHref prefetch={false}>
                    {children}
                  </Link>
                );
              }
              return <MuiLink>{children}</MuiLink>;
            }
          }}
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[[rehypeHighlight, highlightOptionsAI]]}
        >
          {children?.toString()}
        </ReactMarkdown>
      </Box>
    </Box>
  );
}
