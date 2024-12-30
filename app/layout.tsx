// RootLayout.tsx
import React, { type ReactNode, Suspense } from 'react';
import { Inter } from 'next/font/google';
import Footer from '@/app/components/ui/Footer/Footer';
import ThemeRegistry from '@/theme/ThemeRegistry';
import RootErrorBoundary from '@/app/components/errorBoundary/ErrorBoundaryPage';
import { getSession } from '@/lib/server/supabase';
import Sidebar from '@/app/components/ui/Navbar/TopBar';
import SnackbarMessages from './components/ui/SnackbarMessage';
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  metadataBase: new URL('http://localhost:3000/'),
  title: 'Supabase SSR Auth Example',
  description:
    'An example demonstrating server-side rendering with authentication using Supabase.'
};

export default async function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  const session = await getSession(); // Get session
  const isSessionAvailable = session !== null;
  return (
    <html lang="en">
      <ThemeRegistry>
        <RootErrorBoundary>
          <body
            className={inter.className}
            style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100vh'
            }}
          >
            <Sidebar session={isSessionAvailable} />
            {children}
            <Footer />
            <Suspense fallback={null}>
              <SnackbarMessages />
            </Suspense>
          </body>
        </RootErrorBoundary>
      </ThemeRegistry>
    </html>
  );
}
