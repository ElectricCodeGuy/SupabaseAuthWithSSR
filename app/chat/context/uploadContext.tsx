'use client';
import React, {
  createContext,
  useState,
  useContext,
  useMemo,
  useCallback
} from 'react';
import useSWR, { mutate } from 'swr';
import { useRouter } from 'next/navigation';

interface UploadContextType {
  isUploading: boolean;
  uploadFile: (file: File) => Promise<void>;
  uploadProgress: number;
  uploadStatus: string;
  statusSeverity: string;
  selectedFile: File | null;
  setSelectedFile: React.Dispatch<React.SetStateAction<File | null>>;
  selectedBlobs: string[];
  setSelectedBlobs: (blobs: string[]) => void;
  resetUploadState: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
};

export const UploadProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [statusSeverity, setStatusSeverity] = useState<string>('info');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [shouldCheckStatus, setShouldCheckStatus] = useState(false);
  const [shouldProcessDoc, setShouldProcessDoc] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBlobs, setSelectedBlobs] = useState<string[]>([]);

  const router = useRouter();

  // SWR for checking document processing status
  useSWR(
    shouldCheckStatus && currentJobId ? [`/api/checkdoc`, currentJobId] : null,
    async ([url, jobId]) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ jobId })
      });
      if (!response.ok) {
        throw new Error('Failed to fetch processing status');
      }
      return response.json();
    },
    {
      refreshInterval: 5000,
      revalidateOnFocus: false,
      onSuccess: (data) => {
        if (data.status === 'SUCCESS') {
          setUploadProgress(75);
          setUploadStatus('Finalizing files...');
          setShouldCheckStatus(false);
          setShouldProcessDoc(true);
        } else if (data.status === 'PENDING') {
          setUploadStatus('Still analyzing files...');
        } else {
          // Handle other statuses like ERROR
          setIsUploading(false);
          setUploadStatus('Error analyzing files.');
          setStatusSeverity('error');
          resetUploadState();
        }
      },
      onError: (error) => {
        console.error('Error fetching processing status:', error);
        setIsUploading(false);
        setUploadStatus('Error analyzing files.');
        setStatusSeverity('error');
        resetUploadState();
      }
    }
  );

  // SWR for processing document
  useSWR(
    shouldProcessDoc && currentJobId && currentFileName
      ? ['/api/processdoc', currentJobId, currentFileName]
      : null,
    async ([url, jobId, fileName]) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ jobId, fileName })
      });
      if (!response.ok) {
        throw new Error('Failed to process document');
      }
      return response.json();
    },
    {
      onSuccess: (data) => {
        if (data.status === 'SUCCESS') {
          setIsUploading(false);
          setUploadProgress(100);
          setUploadStatus('Files are uploaded and processed.');
          setStatusSeverity('success');
          mutate('userFiles');
          router.refresh();

          // Reset state after 3 seconds
          setTimeout(() => {
            resetUploadState();
          }, 3000);
        } else {
          setIsUploading(false);
          setUploadStatus('Error finalizing files.');
          setStatusSeverity('error');
          resetUploadState();
        }
      },
      onError: (error) => {
        console.error('Error processing document:', error);
        setIsUploading(false);
        setUploadStatus('Error finalizing files.');
        setStatusSeverity('error');
        resetUploadState();
      }
    }
  );

  const resetUploadState = useCallback(() => {
    // Cancel any ongoing SWR requests
    setShouldCheckStatus(false);
    setShouldProcessDoc(false);

    // Clear SWR cache
    mutate([`/api/checkdoc`, currentJobId], null, false);
    mutate(['/api/processdoc', currentJobId, currentFileName], null, false);

    // Reset all state variables
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStatus('');
    setStatusSeverity('info');
    setCurrentJobId(null);
    setCurrentFileName(null);
    setSelectedFile(null);
  }, [currentJobId, currentFileName]);

  const uploadFile = useCallback(async (file: File) => {
    // First reset all state
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('Checking storage limits...');
    setStatusSeverity('info');

    let uploadedFilePath: string | null = null;

    try {
      // Step 1: Check storage limits and get presigned URL from server
      const fileNameWithUnderscores = file.name.trim();

      const presignedResponse = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName: fileNameWithUnderscores,
          fileSize: file.size,
          fileType: file.type
        })
      });

      if (!presignedResponse.ok) {
        const error = await presignedResponse.json();
        throw new Error(error.message || 'Failed to get upload URL');
      }

      const { uploadUrl, filePath, totalSize, maxSize } =
        await presignedResponse.json();

      // Check if we're within limits
      if (totalSize + file.size > maxSize) {
        throw new Error(
          `Upload would exceed the maximum allowed total size of ${
            maxSize / (1024 * 1024)
          } MB.`
        );
      }

      uploadedFilePath = filePath;
      setUploadStatus('Uploading file...');
      setUploadProgress(10);

      // Step 2: Upload file directly to presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream'
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage');
      }

      setUploadProgress(25);
      setUploadStatus('Preparing file for analysis...');

      // Step 3: Notify server that upload is complete and start processing
      const processResponse = await fetch('/api/uploaddoc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uploadedFiles: [
            { name: fileNameWithUnderscores, path: uploadedFilePath }
          ]
        })
      });

      if (!processResponse.ok) {
        throw new Error(
          `Error processing file on server: ${processResponse.statusText}`
        );
      }

      const result = await processResponse.json();

      setUploadProgress(50);
      setUploadStatus('Analyzing file...');

      if (result.results[0].jobId) {
        setCurrentJobId(result.results[0].jobId);
        setCurrentFileName(file.name);
        // Activate the SWR for status checking
        setShouldCheckStatus(true);
      } else {
        throw new Error('No job ID received from server.');
      }
    } catch (error) {
      console.error('Error uploading file:', error);

      // If upload failed and we have a path, notify server to clean up
      if (uploadedFilePath) {
        try {
          await fetch('/api/upload/cleanup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              filePath: uploadedFilePath
            })
          });
        } catch (cleanupError) {
          console.error('Error cleaning up failed upload:', cleanupError);
        }
      }

      if (error instanceof Error) {
        setUploadStatus(error.message);
      } else {
        setUploadStatus(
          'Error uploading or processing file. Please try again.'
        );
      }
      setStatusSeverity('error');
      setIsUploading(false);
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      isUploading,
      uploadFile,
      uploadProgress,
      uploadStatus,
      statusSeverity,
      selectedFile,
      setSelectedFile,
      selectedBlobs,
      setSelectedBlobs,
      resetUploadState
    }),
    [
      isUploading,
      uploadFile,
      uploadProgress,
      uploadStatus,
      statusSeverity,
      selectedFile,
      setSelectedFile,
      selectedBlobs,
      resetUploadState
    ]
  );

  return (
    <UploadContext.Provider value={contextValue}>
      {children}
    </UploadContext.Provider>
  );
};
