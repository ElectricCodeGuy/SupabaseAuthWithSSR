// RootLayout.tsx
import React, { type ReactNode } from 'react';
import { Inter } from 'next/font/google';
import SideBarServer from '@/app/components/ui/Navbar/SideBarServer';
import Footer from '@/app/components/ui/Footer/Footer';
import ThemeRegistry from '@/theme/ThemeRegistry';
import RootErrorBoundary from '@/app/components/errorBoundary/ErrorBoundaryPage';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  metadataBase: new URL('http://localhost:3000/'),
  title: 'Supabase SSR Auth Example',
  description:
    'An example demonstrating server-side rendering with authentication using Supabase.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
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
            <SideBarServer />
            {children}
            <Footer />
          </body>
        </RootErrorBoundary>
      </ThemeRegistry>
    </html>
  );
}
