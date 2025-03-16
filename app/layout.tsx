import React, { type ReactNode, Suspense } from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Footer from '@/app/components/ui/Footer/Footer';
import RootErrorBoundary from '@/app/components/errorBoundary/ErrorBoundaryPage';
import { getSession } from '@/lib/server/supabase';
import NavBar from '@/app/components/ui/Navbar/TopBar';
import SnackbarMessages from './components/ui/SnackbarMessage';
import { ThemeProvider } from '@/components/ui/theme-provider';

import './global.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: false,
  variable: '--font-Inter'
});
export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000/'),
  title: 'Supabase SSR Auth Example',
  description:
    'An example demonstrating server-side rendering with authentication using Supabase.'
};

export default function RootLayout({
  children,
  modal
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <RootErrorBoundary>
        <body
          className={inter.className}
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh'
          }}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* We pass the promise here and resolve it with react.use in the child to prevent the async request from blocking the UI */}
            <NavBar session={getSession()} />
            <main>{children}</main>
            {modal}
            <Footer />
            <Suspense fallback={null}>
              <SnackbarMessages />
            </Suspense>
          </ThemeProvider>
        </body>
      </RootErrorBoundary>
    </html>
  );
}
