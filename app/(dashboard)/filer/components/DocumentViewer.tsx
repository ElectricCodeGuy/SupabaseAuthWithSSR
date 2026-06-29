'use client';

import { Button } from '@/components/ui/button';
import { X, Eye, FileText } from 'lucide-react';
import Link from '@/components/link';

interface DocumentViewerProps {
  fileName: string | null;
  signedUrl: string | null;
}

export function DocumentViewer({ fileName, signedUrl }: DocumentViewerProps) {
  // No document selected
  if (!fileName) {
    return (
      <div className="flex-1 border rounded-lg bg-card flex flex-col items-center justify-center text-center p-8">
        <Eye className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">
          Select a document to see a preview
        </p>
      </div>
    );
  }

  // Document selected but couldn't load URL
  if (!signedUrl) {
    return (
      <div className="flex-1 border rounded-lg bg-card flex flex-col items-center justify-center text-center p-8 relative">
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-3 right-3"
          asChild
        >
          <Link href="/filer">
            <X className="w-4 h-4" />
          </Link>
        </Button>
        <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">Could not load preview</p>
      </div>
    );
  }

  const decodedFileName = decodeURIComponent(fileName);

  return (
    <div className="flex-1 relative">
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between">
        <div className="bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm font-medium truncate max-w-[70%]">
          {decodedFileName}
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="bg-background/90 backdrop-blur-sm"
          asChild
        >
          <Link href="/filer">
            <X className="w-4 h-4" />
          </Link>
        </Button>
      </div>
      <iframe
        src={signedUrl}
        className="w-full h-full border-none"
        title={`Preview: ${decodedFileName}`}
      />
    </div>
  );
}
