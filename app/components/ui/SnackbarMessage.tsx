'use client';
import React, { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

export default function SnackbarMessages() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle clearing the URL params
  const clearParams = () => {
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.delete('error');
    currentParams.delete('message');
    const newPath =
      window.location.pathname +
      (currentParams.toString() ? '?' + currentParams.toString() : '');
    router.replace(newPath);
  };

  useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    // Show toast if params are present
    if (error || message) {
      const content = error
        ? decodeURIComponent(error)
        : decodeURIComponent(message!);

      toast(error ? 'Error' : 'Success', {
        description: content,
        duration: 6000,
        action: {
          label: 'Dismiss',
          onClick: clearParams
        }
      });

      // Clear params right after showing toast
      clearParams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return <Toaster />;
}
