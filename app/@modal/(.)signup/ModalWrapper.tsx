// ModalWrapper.tsx
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Box, Button } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface ModalWrapperProps {
  children: React.ReactNode;
}

export default function ModalWrapper({ children }: ModalWrapperProps) {
  const router = useRouter();

  return (
    <Modal
      open
      onClose={() => router.back()}
      aria-labelledby="sign-up-modal"
      aria-describedby="sign-up-modal-description"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Box
        sx={{
          position: 'relative',
          maxHeight: 'calc(100vh - 44px)',
          width: {
            xs: '95%',
            sm: '90%',
            md: '90%',
            lg: '80%'
          },
          my: 2,
          maxWidth: 1200,
          bgcolor: {
            xs: 'transparent',
            sm: 'background.paper',
            md: 'background.paper'
          },
          boxShadow: {
            xs: 'none',
            sm: 'none',
            md: 24
          },
          p: {
            xs: 0,
            sm: 0,
            md: 2
          },
          borderRadius: 2,
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        <Button
          onClick={() => router.back()}
          sx={{
            display: {
              xs: 'none',
              sm: 'none',
              md: 'block'
            },
            position: 'absolute',
            zIndex: 1,
            top: 0,
            right: 0,
            minWidth: 'unset'
          }}
        >
          <CloseIcon />
        </Button>
        {children}
      </Box>
    </Modal>
  );
}
