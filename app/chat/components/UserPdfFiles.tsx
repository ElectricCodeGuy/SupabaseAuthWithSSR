'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipProvider,
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
  const [blobUrl, setBlobUrl] = useState('');

  useEffect(() => {
    // Convert data URL to blob URL for better browser compatibility
    if (url.startsWith('data:application/pdf;base64,')) {
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
        const newBlobUrl = URL.createObjectURL(blob);
        setBlobUrl(newBlobUrl);

        // Clean up the blob URL when component unmounts
        return () => {
          URL.revokeObjectURL(newBlobUrl);
        };
      } catch (error) {
        console.error('Error converting data URL to blob:', error);
        setIsLoading(false);
      }
    } else {
      // If it's not a data URL, use it directly
      setBlobUrl(url);
    }
  }, [url]);

  return (
    <div className="w-[55%] border-l border-slate-200 hidden sm:flex flex-col justify-start items-stretch overflow-hidden relative">
      <div className="absolute top-0 left-0 z-10 m-2">
        <TooltipProvider>
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
              <p>Luk</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {isLoading && (
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
            Din browser understøtter ikke visning af PDF-filer direkte.
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
          <p>Der opstod en fejl ved indlæsning af PDF-filen.</p>
        </div>
      )}
    </div>
  );
}
