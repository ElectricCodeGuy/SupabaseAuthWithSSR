'use client';

import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Button,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import useSWRImmutable from 'swr/immutable';
import { createClient } from '@/lib/client/client';
import Link from 'next/link';
import { decodeBase64 } from '../lib/base64';
import { useSearchParams, useRouter } from 'next/navigation';
const supabase = createClient();

const fetcher = async (
  fileName: string,
  userId: string,
  fileExtension: string
) => {
  const decodedFileName = decodeURIComponent(fileName);
  const filePath = `${userId}/${decodedFileName}`;

  if (fileExtension === 'pdf') {
    const { data, error } = await supabase.storage
      .from('userfiles')
      .download(filePath);

    if (error) {
      console.error('Error downloading PDF:', error);
      return null;
    }

    const blob = new Blob([data], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  } else if (['doc', 'docx'].includes(fileExtension)) {
    const { data, error } = await supabase.storage
      .from('userfiles')
      .createSignedUrl(filePath, 300);

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  }

  throw new Error('Unsupported file type');
};

export default function DocumentViewer({
  fileName,
  userId,
  hasActiveSubscription
}: {
  fileName: string;
  userId: string | undefined;
  hasActiveSubscription: boolean;
}) {
  const router = useRouter(); // Add router
  const searchParams = useSearchParams();

  // Add handler for close button
  const handleClose = () => {
    // Create new URL without pdf and p parameters
    const url = new URL(window.location.href);
    url.searchParams.delete('pdf');
    url.searchParams.delete('p');
    router.replace(url.pathname + url.search);
  };

  const decodedFileName = decodeURIComponent(decodeBase64(fileName));
  const fileExtension = decodedFileName.split('.').pop()?.toLowerCase() || '';
  const page = Number(searchParams.get('p')) || 1;
  const {
    data: fileUrl,
    error,
    isLoading
  } = useSWRImmutable(
    userId && hasActiveSubscription ? [fileName, userId, fileExtension] : null,
    ([fileName, userId, fileExtension]) =>
      fetcher(fileName, userId, fileExtension)
  );

  if (!userId || !hasActiveSubscription) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '97vh',
          textAlign: 'center'
        }}
      >
        <Typography>
          Du skal være logget ind og have et aktivt abonnement for at se dette
          dokument.
        </Typography>
        <Button
          component={Link}
          href="/signin"
          variant="contained"
          sx={{ mt: 2 }}
        >
          Gå til login
        </Button>
      </Box>
    );
  }

  if (error) {
    console.error('Error loading document:', error);
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '97vh',
          textAlign: 'center'
        }}
      >
        <Typography>
          Fejl ved indlæsning af dokument. Prøv venligst igen senere.
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          width: '55%',
          borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
          display: {
            xs: 'none',
            sm: 'flex'
          },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '97vh',
          textAlign: 'center'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!fileUrl) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '97vh',
          textAlign: 'center'
        }}
      >
        <Typography>Ingen fil tilgængelig.</Typography>
      </Box>
    );
  }

  const isPdf = fileExtension === 'pdf';
  const isOfficeDocument = ['doc', 'docx'].includes(fileExtension);
  const iframeId = `document-viewer-${fileName.replace(/[^a-zA-Z0-9]/g, '-')}`;
  return (
    <Box
      sx={{
        width: '55%',
        borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
        display: {
          xs: 'none',
          sm: 'flex'
        },
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        overflow: 'hidden',
        position: 'relative' // Add this for absolute positioning of close button
      }}
    >
      {/* Add close button */}
      <IconButton
        onClick={handleClose}
        size="small"
        sx={{
          position: 'absolute',
          right: 4,
          top: 4,
          p: 0,
          zIndex: 1000,
          bgcolor: 'rgba(255, 255, 255, 0.7)',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.9)'
          }
        }}
      >
        <CloseIcon />
      </IconButton>

      {isPdf ? (
        <iframe
          key={`pdf-viewer-${page}`}
          id={iframeId}
          src={`${fileUrl}#page=${page}`}
          style={{
            width: '100%',
            height: '100%',
            border: 'none'
          }}
          title="PDF Viewer"
          referrerPolicy="no-referrer"
          aria-label={`PDF document: ${decodedFileName}`}
        />
      ) : isOfficeDocument ? (
        <iframe
          id={iframeId}
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
          style={{
            width: '100%',
            height: '100%',
            border: 'none'
          }}
          title="Office Document Viewer"
          referrerPolicy="no-referrer"
          aria-label={`Office document: ${decodedFileName}`}
        />
      ) : (
        <Typography>Denne filtype understøttes ikke.</Typography>
      )}
    </Box>
  );
}
