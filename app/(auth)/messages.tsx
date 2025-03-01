import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, InfoIcon } from 'lucide-react';

export default function Messages() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const message = searchParams.get('message');

  if (!error && !message) return null;

  return (
    <>
      {error && (
        <div className="w-full flex flex-col items-center">
          <div className="max-w-[90%] w-full">
            <Alert variant="destructive" className="flex gap-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{decodeURIComponent(error)}</AlertDescription>
            </Alert>
          </div>
        </div>
      )}
      {message && (
        <div className="w-full flex flex-col items-center">
          <div className="max-w-[90%] w-full">
            <Alert className="flex gap-2">
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>{decodeURIComponent(message)}</AlertDescription>
            </Alert>
          </div>
        </div>
      )}
    </>
  );
}
