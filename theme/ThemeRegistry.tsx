import React, { ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { GlobalStyles } from '@mui/styled-engine';
import theme from './theme';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';

const globalStyles = (
  <GlobalStyles
    styles={{
      body: {
        backgroundImage: 'radial-gradient(ellipse at 70% 51%, #f0f7ff, #fff)',
        backgroundSize: 'cover',
        boxShadow:
          'rgba(0, 0, 0, 0.05) 0px 5px 15px 0px, rgba(25, 28, 33, 0.05) 0px 15px 35px -5px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px'
      },
      '@keyframes mui-auto-fill': { from: { display: 'block' } },
      '@keyframes mui-auto-fill-cancel': { from: { display: 'block' } },
      '::-webkit-scrollbar': {
        width: '8px',
        backgroundColor: 'transparent'
      },
      '::-webkit-scrollbar-thumb': {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '4px'
      },
      '::-webkit-scrollbar-thumb:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }
    }}
  />
);

export default function ThemeRegistry({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        {globalStyles}
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
