'use client';

import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { decodeBase64 } from '@/utils/base64';
import { useSearchParams, useRouter } from 'next/navigation';

export default function DocumentViewer({
  fileName,
  signedUrl
}: {
  fileName: string;
  signedUrl: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClose = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('pdf');
    url.searchParams.delete('p');
    router.replace(url.pathname + url.search);
  };

  const decodedFileName = decodeURIComponent(decodeBase64(fileName));
  const fileExtension = decodedFileName.split('.').pop()?.toLowerCase() ?? '';
  const page = Number(searchParams.get('p')) || 1;

  if (!signedUrl) {
    return (
      <div className="w-[55%] border-l border-border hidden sm:flex flex-col justify-center items-center overflow-hidden relative h-[96vh]">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="absolute left-1 top-1 z-50 bg-background/70 hover:bg-background/90"
        >
          <X className="h-4 w-4" />
        </Button>
        <p className="text-foreground text-base">
          There was an error loading the document. Please try again later.
        </p>
      </div>
    );
  }

  const isPdf = fileExtension === 'pdf';
  const isOfficeDocument = ['doc', 'docx'].includes(fileExtension);
  const iframeId = `document-viewer-${fileName.replace(/[^a-zA-Z0-9]/g, '-')}`;

  return (
    <div className="w-[55%] border-l border-border hidden sm:flex flex-row justify-center items-start overflow-hidden relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClose}
        className="absolute left-1 top-1 z-50 bg-background/70 hover:bg-background/90"
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="relative w-full h-full">
        {isPdf && (
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-background/40 to-transparent h-10 z-10 dark:from-background/60" />
        )}

        {isPdf ? (
          <iframe
            key={`pdf-viewer-${page}`}
            id={iframeId}
            src={`${signedUrl}#page=${page}`}
            className="w-full h-full border-none"
            title="PDF Viewer"
            referrerPolicy="no-referrer"
            aria-label={`PDF document: ${decodedFileName}`}
          />
        ) : isOfficeDocument ? (
          <iframe
            id={iframeId}
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
              signedUrl
            )}`}
            className="w-full h-full border-none"
            title="Office Document Viewer"
            referrerPolicy="no-referrer"
            aria-label={`Office document: ${decodedFileName}`}
          />
        ) : (
          <p className="text-foreground text-base">
            This file type is not supported.
          </p>
        )}
      </div>
    </div>
  );
}
