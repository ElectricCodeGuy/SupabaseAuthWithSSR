'use client';
import React, { useState, useEffect, createContext } from 'react';
import createTheme from '@mui/material/styles/createTheme';
import ThemeProvider from '@mui/material/styles/ThemeProvider';
import CssBaseline from '@mui/material/CssBaseline';
import NextAppDirEmotionCacheProvider from './EmotionCashe';
import { getDesignTokens } from '@/theme/create-palette';

export const ColorModeContext = createContext({
  toggleColorMode: () => {},
  mode: 'light' as 'light' | 'dark'
});

export default function ThemeRegistry({
  children
}: {
  children: React.ReactNode;
}) {
  // Initialize with 'light' mode. This could be changed to 'dark'
  // or be dynamically set based on user preferences stored in a cookie or some other method.
  const [mode, setMode] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Retrieve stored mode and update state only if it differs
    const storedMode =
      (window.localStorage.getItem('mode') as 'light' | 'dark') || 'light';
    if (storedMode !== mode) {
      setMode(storedMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs once after initial render

  const toggleColorMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    window.localStorage.setItem('mode', newMode);
    setMode(newMode);
  };

  const theme = createTheme(getDesignTokens(mode));

  return (
    <ColorModeContext.Provider value={{ toggleColorMode, mode }}>
      <NextAppDirEmotionCacheProvider options={{ key: 'mui' }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </NextAppDirEmotionCacheProvider>
    </ColorModeContext.Provider>
  );
}
