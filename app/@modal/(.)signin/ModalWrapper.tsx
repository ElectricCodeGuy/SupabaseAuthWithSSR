// ModalWrapper.tsx
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface ModalWrapperProps {
  children: React.ReactNode;
}

export default function ModalWrapper({ children }: ModalWrapperProps) {
  const router = useRouter();

  return (
    <Dialog open onOpenChange={() => router.back()}>
      <DialogTitle className="bg-background text-white">Sign in</DialogTitle>
      <DialogContent
        className="max-h-[90vh] w-[95%] sm:max-w-[90%] md:max-w-[90%] lg:max-w-[1200px] 
        my-2 p-4 sm:p-6 md:p-6 
        bg-background 
        shadow-lg rounded-lg 
        overflow-y-auto overflow-x-hidden "
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}
