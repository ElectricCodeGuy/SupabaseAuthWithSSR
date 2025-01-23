// ModalWrapper.tsx
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Box, Button, Fade, Slide } from '@mui/material';
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
      aria-labelledby="sign-in-modal"
      aria-describedby="sign-in-modal-description"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      closeAfterTransition
    >
      <Fade in timeout={400}>
        <Slide in direction="down" timeout={400}>
          <Box
            sx={{
              position: 'relative', // Add this to make absolute positioning of button work relative to Box
              maxHeight: '100vh',
              width: {
                xs: '95%',
                sm: '90%',
                md: '90%',
                lg: '80%'
              },
              maxWidth: 1000,
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
              my: 2,
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
                top: 0,
                right: 0,
                minWidth: 'unset'
              }}
            >
              <CloseIcon />
            </Button>

            {children}
          </Box>
        </Slide>
      </Fade>
    </Modal>
  );
}
