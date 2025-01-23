// CloseButton.tsx
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

export default function CloseButton() {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.back()}
      sx={{
        position: 'absolute',
        top: 2,
        right: 2,
        minWidth: 'unset'
      }}
    >
      <CloseIcon />
    </Button>
  );
}
