'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Loader2 } from 'lucide-react';
import Link from '@/components/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from '@/components/ui/tooltip';

export default function UserPdfViewer({
  url,
  fileName
}: {
  url: string;
  fileName: string;
}) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  // Derive the blob URL from the incoming url instead of mirroring it into
  // state — data URLs are converted to blob URLs for better browser
  // compatibility; anything else is used directly. Returns '' on a broken
  // data URL, which renders the fallback below.
  const blobUrl = useMemo(() => {
    if (!url.startsWith('data:application/pdf;base64,')) return url;
    try {
      const base64Data = url.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteArrays = [];

      for (let i = 0; i < byteCharacters.length; i += 512) {
        const slice = byteCharacters.slice(i, i + 512);
        const byteNumbers = new Array(slice.length);

        for (let j = 0; j < slice.length; j++) {
          byteNumbers[j] = slice.charCodeAt(j);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      const blob = new Blob(byteArrays, { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error converting data URL to blob:', error);
      return '';
    }
  }, [url]);

  // Clean up generated blob URLs when they change / on unmount.
  useEffect(() => {
    if (blobUrl.startsWith('blob:')) {
      return () => URL.revokeObjectURL(blobUrl);
    }
  }, [blobUrl]);

  return (
    <div className="w-[55%] border-l border-slate-200 hidden sm:flex flex-col justify-start items-stretch overflow-hidden relative">
      <div className="absolute top-0 left-0 z-10 m-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              asChild
              className="rounded-md p-1 h-6 w-6 bg-white text-gray-800 transition-all duration-200 border border-slate-200 hover:bg-white hover:shadow-md hover:text-primary hover:border-primary"
            >
              <Link href={pathname} replace prefetch={false}>
                <X className="h-4 w-4 font-bold" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Close</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {isLoading && blobUrl !== '' && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {blobUrl ? (
        <object
          data={blobUrl}
          type="application/pdf"
          className="w-full h-full"
          onLoad={() => setIsLoading(false)}
        >
          <p className="p-4 text-center">
            Your browser cannot display PDF files directly.
            <a
              href={blobUrl}
              download={fileName}
              className="ml-2 text-blue-600 underline"
            >
              Download PDF
            </a>
          </p>
        </object>
      ) : (
        <div className="flex flex-col items-center justify-center h-full p-4">
          <p>Something went wrong while loading the PDF file.</p>
        </div>
      )}
    </div>
  );
}
