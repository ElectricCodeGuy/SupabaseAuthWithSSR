'use client';
import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Link as MuiLink,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface DocumentViewerProps {
  url: string;
}

const WebsiteViewer: React.FC<DocumentViewerProps> = ({ url }) => {
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
    <Box
      sx={{
        width: '50%',
        overflowY: 'auto',
        height: 'calc(100vh - 44px)',
        borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box
        sx={{
          height: '40px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px',
          backgroundColor: 'white'
        }}
      >
        <Tooltip title="Close">
          <IconButton
            component={Link}
            href={pathname}
            replace
            prefetch={false}
            sx={{
              m: 0.1,
              borderRadius: '6px',
              padding: '4px',
              height: '28px',
              width: '28px',
              backgroundColor: 'white',
              color: 'grey.800',
              transition: 'all 0.2s ease-in-out',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              '&:hover': {
                transform: 'translateY(-1px)',
                backgroundColor: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                color: 'primary.main',
                borderColor: 'primary.main'
              }
            }}
          >
            <CloseIcon sx={{ fontSize: 16, fontWeight: 'bold' }} />
          </IconButton>
        </Tooltip>
        <MuiLink
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          title={url}
          sx={{
            ml: 2,
            display: 'flex',
            alignItems: 'center',
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
        >
          <Typography
            variant="body2"
            sx={{
              maxWidth: '400px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {url}
          </Typography>
          <OpenInNewIcon sx={{ ml: 0.5, fontSize: 16 }} />
        </MuiLink>
      </Box>
      <iframe
        src={getProxiedUrl(url)}
        style={{
          width: '100%',
          height: '100%',
          border: 'none'
        }}
        title="Website Viewer"
      />
    </Box>
  );
};

export default WebsiteViewer;
