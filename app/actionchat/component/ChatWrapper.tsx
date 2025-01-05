'use client';
import React, { useState } from 'react';
import { StreamableValue, useStreamableValue } from 'ai/rsc';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link as MuiLink,
  Grid2,
  Stack,
  IconButton
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
  CheckCircle as CheckCircleIcon,
  Public as PublicIcon,
  OpenInNew as OpenInNewIcon,
  Link as LinkIcon
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
        pb: 1,
        borderRadius: '8px',
        margin: {
          xs: '2px 0',
          sm: '2px 0',
          md: '2px 0'
        },
        ml: 1,
        flexGrow: 1,
        overflow: 'hidden',
        px: 1,
        alignSelf: 'flex-end',
        wordBreak: 'break-word',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 'bold',
          position: 'absolute',
          top: 0,
          left: '10px',
          width: '100%',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis'
        }}
      >
        {full_name}
      </Typography>
      <ReactMarkdown>{children?.toString()}</ReactMarkdown>
    </Box>
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
        onClick={() => handleCopy(content || '')}
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
                // Check if the link starts with http:// or https://
                if (href.startsWith('http://') || href.startsWith('https://')) {
                  // For web links, return a regular link that opens in a new tab
                  return (
                    <MuiLink
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </MuiLink>
                  );
                } else {
                  // For document links, use createDocumentLink
                  const fullHref = createDocumentLink(href);
                  return (
                    <Link href={fullHref} passHref prefetch={false}>
                      {children}
                    </Link>
                  );
                }
              }
              return <MuiLink>{children}</MuiLink>;
            }
          }}
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[[rehypeHighlight, highlightOptionsAI]]}
        >
          {content}
        </ReactMarkdown>
      </Box>
    </Box>
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
}) => (
  <Box sx={{ my: 2 }}>
    <Typography
      variant="h6"
      sx={{
        mb: 2,
        color: 'primary.main',
        fontWeight: 600,
        textAlign: 'center',
        borderBottom: '2px solid',
        borderColor: 'primary.light',
        pb: 1
      }}
    >
      📚 Reference Sources ({searchResults.length})
    </Typography>

    <Grid2 container spacing={2} justifyContent="center">
      {searchResults.map((result, index) => {
        const domain = new URL(result.url).hostname.replace('www.', '');

        return (
          <Grid2
            size={{ xs: 12, sm: 6, md: 6 }}
            key={index}
            sx={{
              p: 2,
              height: '100%', // Make paper fill grid height
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              borderRadius: 2,
              transition: 'all 0.3s ease',
              backgroundColor: 'background.paper',
              boxShadow: (theme) => theme.shadows[3],
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: (theme) => theme.shadows[4],
                '& .source-link': {
                  color: 'primary.main'
                }
              }
            }}
          >
            <Box sx={{ flex: 1 }}>
              {' '}
              {/* Flex container for title */}
              <MuiLink
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="source-link"
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  color: 'text.primary',
                  textDecoration: 'none',
                  lineHeight: 1.4,
                  transition: 'color 0.2s ease'
                }}
              >
                <LinkIcon
                  sx={{
                    color: 'primary.main',
                    fontSize: '1.2rem',
                    mt: 0.3,
                    flexShrink: 0 // Prevent icon from shrinking
                  }}
                />
                <Typography
                  component="span"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%'
                  }}
                >
                  {result.title}
                </Typography>
              </MuiLink>
            </Box>

            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{
                pt: 1,
                borderTop: '1px solid',
                borderColor: 'grey.200',
                mt: 'auto' // Push to bottom
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: 'text.secondary'
                }}
              >
                <PublicIcon sx={{ fontSize: '1rem' }} />
                {domain}
              </Typography>

              <IconButton
                size="small"
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: 'primary.main' }}
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Grid2>
        );
      })}
    </Grid2>
  </Box>
);
