import React, { type ReactNode, Suspense } from 'react';
import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Footer from '@/app/components/ui/Footer/Footer';
import ThemeRegistry from '@/theme/ThemeRegistry';
import RootErrorBoundary from '@/app/components/errorBoundary/ErrorBoundaryPage';
import { getSession } from '@/lib/server/supabase';
import NavBar from '@/app/components/ui/Navbar/TopBar';
import SnackbarMessages from './components/ui/SnackbarMessage';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000/'),
  title: 'Supabase SSR Auth Example',
  description:
    'An example demonstrating server-side rendering with authentication using Supabase.'
};

export default async function RootLayout({
  children,
  modal
}: {
  children: ReactNode;
  modal: ReactNode;
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
            <NavBar session={isSessionAvailable} />
            {children}
            {modal}
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
