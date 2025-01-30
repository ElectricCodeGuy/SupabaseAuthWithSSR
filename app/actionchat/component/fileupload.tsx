import React, { useCallback, useRef } from 'react';
import { useDropzone, FileRejection, FileWithPath } from 'react-dropzone';
import {
  Typography,
  Box,
  Button,
  IconButton,
  Paper,
  LinearProgress,
  Alert,
  CircularProgress
} from '@mui/material';
import { useUpload } from '../context/uploadContext';
import {
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';

const SUPPORTED_FILE_TYPES: { [key: string]: string[] } = {
  'application/pdf': ['.pdf', '.PDF'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    '.docx',
    '.DOCX'
  ]
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB in bytes

function LinearProgressWithLabel({
  value,
  status
}: {
  value: number;
  status: string;
}) {
  const statusesWithSpinner = [
    'Uploading file...',
    'Preparing file for analysis...',
    'Analyzing file...',
    'Finalizing files...',
    'Still analyzing files...'
  ];

  const shouldShowSpinner = statusesWithSpinner.includes(status);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
        <Box sx={{ width: '100%', mr: 1 }}>
          <LinearProgress
            variant="determinate"
            value={value}
            sx={{
              height: 6,
              borderRadius: 2,
              bgcolor: '#E2E5EF',
              '& .MuiLinearProgress-bar': {
                borderRadius: 2,
                bgcolor: '#6A64F1',
                transition: 'transform 0.4s linear'
              }
            }}
          />
        </Box>
        <Box sx={{ minWidth: 35 }}>
          <Typography variant="body2" color="text.secondary">
            {`${Math.round(value)}%`}
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          ml: 1,
          minHeight: '20px'
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontWeight: 500,
            transition: 'opacity 0.3s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          {status}
          {shouldShowSpinner && (
            <CircularProgress
              size={16}
              thickness={4}
              sx={{ color: '#6A64F1' }}
            />
          )}
        </Typography>
      </Box>
    </Box>
  );
}
export default function ServerUploadPage() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const {
    isUploading,
    uploadFile,
    uploadProgress,
    uploadStatus,
    statusSeverity,
    selectedFile,
    setSelectedFile
  } = useUpload();

  const validateFile = useCallback(
    (file: FileWithPath | null, fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        return false;
      }
      return true;
    },
    []
  );

  const onDrop = useCallback(
    (acceptedFiles: FileWithPath[], fileRejections: FileRejection[]) => {
      const file = acceptedFiles[0] || null;
      if (validateFile(file, fileRejections)) {
        setSelectedFile(file);
      }
    },
    [setSelectedFile, validateFile]
  );

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      await uploadFile(selectedFile);
    } finally {
      formRef.current?.reset();
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: SUPPORTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false
  });

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      ref={formRef}
      elevation={0}
      sx={{
        maxWidth: '550px',
        mx: 'auto',
        bgcolor: 'white'
      }}
    >
      <Box
        {...getRootProps()}
        sx={{
          minHeight: '50px',
          border: '2px dashed',
          borderColor: isDragActive ? '#6A64F1' : '#e0e0e0',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          cursor: 'pointer',
          p: 1,
          mb: 1,
          transition: 'all 0.2s ease-in-out',
          bgcolor: isDragActive ? 'rgba(106, 100, 241, 0.05)' : 'transparent',
          '&:hover': {
            borderColor: '#6A64F1',
            bgcolor: 'rgba(106, 100, 241, 0.05)'
          }
        }}
      >
        <input {...getInputProps()} />
        <Box>
          <Box
            sx={{
              '& .MuiSvgIcon-root': {
                width: 35,
                height: 35,
                color: isDragActive ? '#6A64F1' : '#07074D',
                transition: 'all 0.2s ease-in-out'
              }
            }}
          >
            <CloudUploadIcon />
          </Box>
          <Typography
            variant="h6"
            sx={{
              color: isDragActive ? '#6A64F1' : '#07074D',
              fontWeight: 600,
              mb: 1,
              transition: 'color 0.2s ease-in-out'
            }}
          >
            {isDragActive ? 'Drop the file here...' : 'Drag files here'}
          </Typography>
          <Typography sx={{ color: '#6B7280', mb: 0.5 }}>Or</Typography>
          <Button
            variant="outlined"
            sx={{
              color: '#07074D',
              borderColor: '#e0e0e0',
              px: 3,

              '&:hover': {
                borderColor: '#6A64F1',
                bgcolor: 'transparent'
              }
            }}
          >
            Browse
          </Button>
          <Typography
            variant="body2"
            sx={{
              color: '#6B7280',
              mt: 1,
              fontSize: '0.875rem'
            }}
          >
            Supported formats: PDF, DOCX
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#9CA3AF',
              fontSize: '0.75rem',
              mt: 0.5,
              fontStyle: 'italic'
            }}
          >
            Note that files with more than approximately 600 pages are not
            currently supported.
          </Typography>
        </Box>
      </Box>

      {selectedFile && (
        <Paper
          elevation={0}
          sx={{
            bgcolor: '#F5F7FB',
            p: 1,
            mb: 2,
            borderRadius: '8px'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: '#6A64F1',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}
              >
                <DescriptionIcon />
              </Box>
              <Box sx={{ minWidth: 0, maxWidth: '80%' }}>
                <Typography
                  sx={{
                    color: '#07074D',
                    fontWeight: 500,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    wordBreak: 'break-word',
                    lineHeight: 1.2,
                    mb: 0.5
                  }}
                >
                  {selectedFile.name}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={handleRemoveFile}
              size="small"
              disabled={isUploading}
              sx={{
                color: '#07074D',
                '&:hover': {
                  color: '#6A64F1'
                }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ mt: 2 }}>
            <LinearProgressWithLabel
              value={uploadProgress}
              status={uploadStatus}
            />
            {uploadStatus && statusSeverity !== 'info' && (
              <Alert
                severity={statusSeverity}
                sx={{ mt: 1, borderRadius: '8px' }}
              >
                {uploadStatus}
              </Alert>
            )}
          </Box>
        </Paper>
      )}

      <Button
        type="submit"
        fullWidth
        disabled={isUploading || !selectedFile}
        startIcon={<CloudUploadIcon />}
        sx={{
          bgcolor: '#6A64F1',
          color: 'white',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: 600,
          textTransform: 'none',
          '&:hover': {
            bgcolor: '#5952d4'
          },
          '&.Mui-disabled': {
            bgcolor: '#9EA1CA',
            color: 'white'
          }
        }}
      >
        {isUploading ? 'Uploading...' : 'Upload File'}
      </Button>
    </Paper>
  );
}
