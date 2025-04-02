'use client';
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
  useCallback
} from 'react';
import { createClient } from '@/lib/client/client';
import { encodeBase64 } from '../lib/base64';
import useSWR, { useSWRConfig } from 'swr';

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
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

const MAX_TOTAL_SIZE = 150 * 1024 * 1024;
const supabase = createClient();

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
};

export const UploadProvider: React.FC<{
  children: React.ReactNode;
  userId: string;
}> = ({ children, userId }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [statusSeverity, setStatusSeverity] = useState<string>('info');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [shouldProcessDoc, setShouldProcessDoc] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBlobs, setSelectedBlobs] = useState<string[]>([]);

  const { mutate } = useSWRConfig();

  const { data: processingStatus, error: processingError } = useSWR(
    currentJobId && !shouldProcessDoc ? `/api/checkdoc` : null,
    async (url) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ jobId: currentJobId })
      });
      if (!response.ok) {
        throw new Error('Failed to fetch processing status');
      }
      return response.json();
    },
    {
      refreshInterval: 5000,
      revalidateOnFocus: false
    }
  );

  const { data: processDocResult, error: processDocError } = useSWR(
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
    }
  );

  const uploadFile = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadStatus('Uploading file...');
      setStatusSeverity('info');
      async function getTotalUploadedSize(): Promise<number> {
        const { data, error } = await supabase.storage
          .from('userfiles')
          .list(userId);

        if (error) {
          console.error('Error fetching user files:', error);
          return 0;
        }

        return data.reduce(
          (total, file) => total + (file.metadata.size || 0),
          0
        );
      }

      const uploadToSupabase = async (file: File, userId: string) => {
        const fileNameWithUnderscores = file.name.replace(/ /g, '_').trim();
        const encodedFileName = encodeBase64(fileNameWithUnderscores);
        const filePath = `${userId}/${encodedFileName}`;

        const { data, error } = await supabase.storage
          .from('userfiles')
          .upload(filePath, file, { upsert: true });

        if (error) {
          console.error('Error uploading file:', error);
          throw new Error(`Failed to upload file: ${file.name}`);
        }

        if (!data.path) {
          console.error('Upload successful but path is missing');
          throw new Error(`Failed to get path for uploaded file: ${file.name}`);
        }

        return data.path;
      };
      let uploadedFilePath: string | null = null;

      try {
        const currentTotalSize = await getTotalUploadedSize();
        const newTotalSize = currentTotalSize + file.size;

        if (newTotalSize > MAX_TOTAL_SIZE) {
          throw new Error(
            'Upload would exceed the maximum allowed total size of 150 MB.'
          );
        }

        uploadedFilePath = await uploadToSupabase(file, userId);
        const fileNameWithUnderscores = file.name.replace(/ /g, '_').trim();

        setUploadProgress(25);
        setUploadStatus('Preparing file for analysis...');

        const response = await fetch('/api/uploaddoc', {
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

        if (!response.ok) {
          throw new Error(
            `Error processing file on server: ${response.statusText}`
          );
        }

        const result = await response.json();
        setUploadProgress(50);
        setUploadStatus('Analyzing file...');

        if (result.results[0].jobId) {
          setCurrentJobId(result.results[0].jobId);
          setCurrentFileName(file.name);
        } else {
          throw new Error('No job ID received from server.');
        }
      } catch (error) {
        console.error('Error uploading file:', error);

        if (uploadedFilePath) {
          try {
            const { error: deleteError } = await supabase.storage
              .from('userfiles')
              .remove([uploadedFilePath]);

            if (deleteError) {
              console.error(
                `Error deleting file ${uploadedFilePath}:`,
                deleteError
              );
            }
          } catch (deleteError) {
            console.error(
              `Error deleting file ${uploadedFilePath}:`,
              deleteError
            );
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
        setCurrentJobId(null);
        setCurrentFileName(null);
      }
    },
    [userId]
  );

  const resetUploadState = () => {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStatus('');
    setStatusSeverity('info');
    setCurrentJobId(null);
    setCurrentFileName(null);
    setShouldProcessDoc(false);
    setSelectedFile(null);
  };

  useEffect(() => {
    if (processingStatus) {
      if (processingStatus.status === 'SUCCESS') {
        setUploadProgress(75);
        setUploadStatus('Finalizing files...');
        setShouldProcessDoc(true);
      } else if (processingStatus.status === 'PENDING') {
        setUploadStatus('Still analyzing files...');
      }
    } else if (processingError) {
      setIsUploading(false);
      setUploadStatus('Error analyzing files.');
      setStatusSeverity('error');
      setCurrentJobId(null);
      setCurrentFileName(null);
      setShouldProcessDoc(false);
    }

    if (processDocResult) {
      if (processDocResult.status === 'SUCCESS') {
        setIsUploading(false);
        setUploadProgress(100);
        setUploadStatus('Files are uploaded and processed.');
        setStatusSeverity('success');
        mutate(`userFiles`);

        // Set a timeout to reset the state after 2 seconds
        setTimeout(() => {
          resetUploadState();
        }, 3000);
      } else {
        setIsUploading(false);
        setUploadStatus('Error finalizing files.');
        setStatusSeverity('error');
        setCurrentJobId(null);
        setCurrentFileName(null);
        setShouldProcessDoc(false);
      }
    } else if (processDocError) {
      setIsUploading(false);
      setUploadStatus('Error finalizing files.');
      setStatusSeverity('error');
      setCurrentJobId(null);
      setCurrentFileName(null);
      setShouldProcessDoc(false);
    }
  }, [
    processingStatus,
    processingError,
    processDocResult,
    processDocError,
    mutate
  ]);

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
      setSelectedBlobs
    }),
    [
      isUploading,
      uploadFile,
      uploadProgress,
      uploadStatus,
      statusSeverity,
      selectedFile,
      setSelectedFile,
      selectedBlobs
    ]
  );

  return (
    <UploadContext.Provider value={contextValue}>
      {children}
    </UploadContext.Provider>
  );
};
