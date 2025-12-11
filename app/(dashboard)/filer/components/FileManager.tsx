'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone, FileRejection, FileWithPath } from 'react-dropzone';
import useSWR, { mutate } from 'swr';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  FileText,
  Upload,
  Trash2,
  Calendar,
  Loader,
  X,
  FileStack
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { da } from 'date-fns/locale';
import Link from 'next/link';
import { deleteUserFile } from '../action';
import { encodeBase64 } from '@/utils/base64';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';

function getDocUrl(title: string): string {
  const encoded = encodeBase64(title);
  return `/filer?doc=${encodeURIComponent(encoded)}`;
}

interface UserDocument {
  id: string;
  title: string;
  created_at: string;
  total_pages: number | null;
  file_path: string | null;
}

interface FileManagerProps {
  documents: UserDocument[];
  selectedDocFileName: string | null;
  currentPage: number;
}

const ITEMS_PER_PAGE = 10;

const SUPPORTED_FILE_TYPES: { [key: string]: string[] } = {
  'application/pdf': ['.pdf', '.PDF']
};
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export function FileManager({
  documents,
  selectedDocFileName,
  currentPage
}: FileManagerProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);

  // Pagination
  const totalPages = Math.ceil(documents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedDocuments = documents.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const getPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());
    if (selectedDocFileName) params.set('doc', selectedDocFileName);
    const queryString = params.toString();
    return `/filer${queryString ? `?${queryString}` : ''}`;
  };

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [shouldCheckStatus, setShouldCheckStatus] = useState(false);
  const [shouldProcessDoc, setShouldProcessDoc] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<UserDocument | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const resetUploadState = useCallback(() => {
    setShouldCheckStatus(false);
    setShouldProcessDoc(false);
    mutate([`/api/checkdoc`, currentJobId], null, false);
    mutate(['/api/processdoc', currentJobId, currentFileName], null, false);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStatus('');
    setCurrentJobId(null);
    setCurrentFileName(null);
    setSelectedFile(null);
  }, [currentJobId, currentFileName]);

  // Check if a document is selected based on URL
  const isDocSelected = (doc: UserDocument) => {
    if (!selectedDocFileName) return false;
    const encoded = encodeBase64(doc.title);
    return encoded === selectedDocFileName;
  };

  // SWR for checking document processing status
  useSWR(
    shouldCheckStatus && currentJobId ? [`/api/checkdoc`, currentJobId] : null,
    async ([url, jobId]) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });
      if (!response.ok) throw new Error('Failed to fetch processing status');
      return response.json();
    },
    {
      refreshInterval: 5000,
      revalidateOnFocus: false,
      onSuccess: (data) => {
        if (data.status === 'SUCCESS') {
          setUploadProgress(75);
          setUploadStatus('Færdigbehandler fil...');
          setShouldCheckStatus(false);
          setShouldProcessDoc(true);
        } else if (data.status === 'PENDING') {
          setUploadStatus('Analyserer fil...');
        } else {
          setUploadStatus('Fejl ved analyse af fil.');
          resetUploadState();
        }
      },
      onError: () => {
        setUploadStatus('Fejl ved analyse af fil.');
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, fileName })
      });
      if (!response.ok) throw new Error('Failed to process document');
      return response.json();
    },
    {
      onSuccess: (data) => {
        if (data.status === 'SUCCESS') {
          setUploadProgress(100);
          setUploadStatus('Upload fuldført!');
          mutate('userFiles');
          router.refresh();
          setTimeout(() => resetUploadState(), 2000);
        } else {
          setUploadStatus('Fejl ved behandling af fil.');
          resetUploadState();
        }
      },
      onError: () => {
        setUploadStatus('Fejl ved behandling af fil.');
        resetUploadState();
      }
    }
  );

  const uploadFile = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadStatus('Uploader...');

      let uploadedFilePath: string | null = null;

      try {
        const fileNameWithUnderscores = file.name.trim();

        const presignedResponse = await fetch('/api/upload/presigned-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: fileNameWithUnderscores,
            fileSize: file.size,
            fileType: file.type
          })
        });

        if (!presignedResponse.ok) {
          const error = await presignedResponse.json();
          throw new Error(error.message || 'Kunne ikke få upload URL');
        }

        const { uploadUrl, filePath, totalSize, maxSize } =
          await presignedResponse.json();

        if (totalSize + file.size > maxSize) {
          throw new Error(
            `Maks størrelse overskredet (${maxSize / (1024 * 1024)} MB)`
          );
        }

        uploadedFilePath = filePath;
        setUploadProgress(20);

        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type || 'application/octet-stream' }
        });

        if (!uploadResponse.ok) {
          throw new Error('Kunne ikke uploade fil');
        }

        setUploadProgress(40);
        setUploadStatus('Forbereder analyse...');

        const processResponse = await fetch('/api/uploaddoc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uploadedFiles: [
              { name: fileNameWithUnderscores, path: uploadedFilePath }
            ]
          })
        });

        if (!processResponse.ok) {
          throw new Error('Fejl ved behandling af fil');
        }

        const result = await processResponse.json();
        setUploadProgress(50);
        setUploadStatus('Analyserer fil...');

        if (result.results[0].jobId) {
          setCurrentJobId(result.results[0].jobId);
          setCurrentFileName(file.name);
          setShouldCheckStatus(true);
        } else {
          throw new Error('Intet job ID modtaget');
        }
      } catch (error) {
        console.error('Upload error:', error);

        if (uploadedFilePath) {
          try {
            await fetch('/api/upload/cleanup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filePath: uploadedFilePath })
            });
          } catch {}
        }

        setUploadStatus(
          error instanceof Error ? error.message : 'Upload fejlede'
        );
        setTimeout(() => resetUploadState(), 3000);
      }
    },
    [resetUploadState]
  );

  const onDrop = useCallback(
    (acceptedFiles: FileWithPath[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) return;
      const file = acceptedFiles[0];
      if (file) {
        setSelectedFile(file);
      }
    },
    []
  );

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile && !isUploading) {
      await uploadFile(selectedFile);
    }
  };

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null);
    resetUploadState();
    formRef.current?.reset();
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: SUPPORTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    noClick: selectedFile !== null || isUploading
  });

  // Delete handlers
  const handleDeleteClick = (doc: UserDocument, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDocumentToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete || !documentToDelete.file_path) return;

    setDeletingId(documentToDelete.id);
    setDeleteDialogOpen(false);

    const formData = new FormData();
    formData.append('file_path', documentToDelete.file_path);
    formData.append('file_id', documentToDelete.id);

    const result = await deleteUserFile(formData);
    if (result.success) {
      // If deleted doc was selected, clear URL
      if (isDocSelected(documentToDelete)) {
        router.push('/filer');
      }
      router.refresh();
    }
    setDeletingId(null);
    setDocumentToDelete(null);
  };

  return (
    <>
      <div className="w-[400px] flex flex-col border rounded-lg bg-card">
        {/* Upload Area */}
        <form
          onSubmit={handleUploadSubmit}
          ref={formRef}
          className="p-4 border-b"
        >
          {!selectedFile && !isUploading ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload
                className={`w-6 h-6 mx-auto mb-2 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`}
              />
              <p className="text-sm font-medium">
                {isDragActive ? 'Slip filen her' : 'Træk fil hertil eller klik'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, maks 50 MB
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {selectedFile?.name}
                  </p>
                  {isUploading && (
                    <div className="mt-2">
                      <Progress value={uploadProgress} className="h-1.5" />
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        {uploadStatus}
                        {uploadProgress < 100 && (
                          <Loader className="w-3 h-3 animate-spin" />
                        )}
                      </p>
                    </div>
                  )}
                </div>
                {!isUploading && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveSelectedFile}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {!isUploading && (
                <Button type="submit" size="sm" className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              )}
            </div>
          )}
        </form>

        {/* File List */}
        <ScrollArea className="flex-1">
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <FileStack className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                Ingen dokumenter uploadet endnu
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {paginatedDocuments.map((doc) => {
                const isSelected = isDocSelected(doc);
                const isDeleting = deletingId === doc.id;
                const docUrl = getDocUrl(doc.title);
                const timeAgo = formatDistanceToNow(new Date(doc.created_at), {
                  addSuffix: true,
                  locale: da
                });

                const content = (
                  <>
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p
                        className="text-sm font-medium truncate max-w-[240px]"
                        title={doc.title}
                      >
                        {doc.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{timeAgo}</span>
                        {doc.total_pages && (
                          <>
                            <span>·</span>
                            <span className="flex-shrink-0">
                              {doc.total_pages} sider
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDeleteClick(doc, e)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </>
                );

                const className = `group flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-muted/50'
                } ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`;

                return (
                  <Link key={doc.id} href={docUrl} className={className}>
                    {content}
                  </Link>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer with pagination */}
        <div className="p-3 border-t">
          {totalPages > 1 ? (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={currentPage > 1 ? getPageUrl(currentPage - 1) : '#'}
                    className={
                      currentPage <= 1 ? 'pointer-events-none opacity-50' : ''
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href={getPageUrl(page)}
                        isActive={page === currentPage}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    href={
                      currentPage < totalPages
                        ? getPageUrl(currentPage + 1)
                        : '#'
                    }
                    className={
                      currentPage >= totalPages
                        ? 'pointer-events-none opacity-50'
                        : ''
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : (
            <p className="text-xs text-muted-foreground text-center">
              {documents.length} dokument{documents.length !== 1 ? 'er' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slet dokument?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette &quot;{documentToDelete?.title}
              &quot;? Dette vil også fjerne dokumentet fra din chat-kontekst.
              Denne handling kan ikke fortrydes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Slet dokument
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
