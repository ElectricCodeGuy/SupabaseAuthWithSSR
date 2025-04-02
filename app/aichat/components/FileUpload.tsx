import React, { useCallback, useRef } from 'react';
import type { FileRejection, FileWithPath } from 'react-dropzone';
import { useDropzone } from 'react-dropzone';
import { useUpload } from '../context/uploadContext';
import {
  Loader2,
  Upload as CloudUploadIcon,
  X as CloseIcon,
  FileText as DescriptionIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';

const SUPPORTED_FILE_TYPES: Record<string, string[]> = {
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
    <>
      <div className="flex items-center w-full mb-1">
        <div className="w-full mr-1">
          <Progress
            value={value}
            className="h-1.5 bg-muted [&>div]:bg-primary [&>div]:transition-transform [&>div]:duration-400 [&>div]:ease-linear rounded-md"
          />
        </div>
        <div className="min-w-[35px]">
          <p className="text-sm text-muted-foreground">{`${Math.round(
            value
          )}%`}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 ml-1 min-h-[20px]">
        <p className="text-sm text-muted-foreground font-medium flex items-center gap-1 transition-opacity duration-300">
          {status}
          {shouldShowSpinner && (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
        </p>
      </div>
    </>
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
    <form
      className="max-w-[550px] mx-auto bg-background"
      onSubmit={handleSubmit}
      ref={formRef}
    >
      <div
        {...getRootProps()}
        className={`min-h-[50px] border-2 border-dashed ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary hover:bg-primary/5'
        } rounded-lg flex items-center justify-center text-center cursor-pointer p-4 mb-4 transition-all duration-200`}
      >
        <input {...getInputProps()} />
        <div>
          <div className="flex justify-center">
            <CloudUploadIcon
              className={`w-9 h-9 ${
                isDragActive ? 'text-primary' : 'text-foreground'
              } transition-colors duration-200`}
            />
          </div>
          <h6
            className={`text-lg font-semibold mb-1 ${
              isDragActive ? 'text-primary' : 'text-foreground'
            } transition-colors duration-200`}
          >
            {isDragActive ? 'Drop the file here...' : 'Drag files here'}
          </h6>
          <p className="text-muted-foreground mb-0.5">Or</p>
          <Button
            variant="outline"
            className="text-foreground border-border px-3 hover:border-primary hover:bg-transparent"
            type="button"
          >
            Browse
          </Button>
          <p className="text-muted-foreground mt-1 text-sm">
            Supported formats: PDF, DOCX
          </p>
          <p className="text-muted-foreground/70 text-xs mt-0.5 italic">
            Note that files with more than approximately 600 pages are not
            currently supported.
          </p>
        </div>
      </div>

      {selectedFile && (
        <Card className="bg-card/50 p-4 mb-4 rounded-lg shadow-none">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                <DescriptionIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 max-w-[80%]">
                <p className="text-foreground font-medium overflow-hidden line-clamp-2 break-words leading-tight mb-0.5">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              disabled={isUploading}
              className="text-foreground hover:text-primary"
            >
              <CloseIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2">
            <LinearProgressWithLabel
              value={uploadProgress}
              status={uploadStatus}
            />
            {uploadStatus && statusSeverity !== 'info' && (
              <Alert
                variant={statusSeverity === 'error' ? 'destructive' : 'default'}
                className="mt-1 rounded-lg"
              >
                <AlertDescription>{uploadStatus}</AlertDescription>
              </Alert>
            )}
          </div>
        </Card>
      )}

      <Button
        type="submit"
        disabled={isUploading || !selectedFile}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold rounded-lg py-2 disabled:opacity-50"
      >
        <CloudUploadIcon className="mr-2 h-5 w-5" />
        {isUploading ? 'Uploading...' : 'Upload File'}
      </Button>
    </form>
  );
}
