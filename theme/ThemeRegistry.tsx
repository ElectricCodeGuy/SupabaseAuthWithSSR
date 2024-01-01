'use client';
import React from 'react';
import ThemeProvider from '@mui/material/styles/ThemeProvider';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';

export default function ThemeRegistry({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
