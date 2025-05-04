import React, { type ReactNode } from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Footer from '@/app/components/ui/Footer/Footer';
import { getSession } from '@/lib/server/supabase';
import NavBar from '@/app/components/ui/Navbar/TopBar';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { Toaster } from '@/components/ui/sonner';

import './globals.css';

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
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* We pass the promise here and resolve it with react.use in the child to prevent the async request from blocking the UI */}
          <NavBar session={getSession()} />
          <main>{children}</main>
          <Toaster />
          {modal}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
