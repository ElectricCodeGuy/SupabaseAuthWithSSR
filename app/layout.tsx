import { type ReactNode } from 'react';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Outfit, Geist_Mono } from 'next/font/google';
import './globals.css';
import {
  AUTHOR,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL
} from '@/lib/site';

// Fonts are wired through CSS variables, not applied directly:
// next/font only DEFINES --font-sans / --font-mono on <body>; globals.css
// maps them into Tailwind's theme (@theme inline) and applies `font-sans` on
// body. Components use the font-sans/font-serif/font-mono utilities, so a
// future theme swap only touches the tokens in globals.css — never the
// components.
//
// There is no serif import on purpose: the theme's --font-serif is
// "Georgia, serif", and Georgia is a system font (it is not on Google
// Fonts) — nothing to download. To ship a custom serif later, import one
// here with variable: '--font-serif' and add it to the <body> className.
const fontSans = Outfit({
  subsets: ['latin'],
  variable: '--font-sans'
});

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono'
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
  creator: AUTHOR.name,
  // openGraph.url and alternates.canonical are set per page (see
  // app/page.tsx): metadata inherits down the tree, so a canonical of '/'
  // here would mark every other route as a duplicate of the landing page.
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION
  }
};

export default async function RootLayout({
  children,
  modal
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster richColors />
          {modal}
        </ThemeProvider>
      </body>
    </html>
  );
}
