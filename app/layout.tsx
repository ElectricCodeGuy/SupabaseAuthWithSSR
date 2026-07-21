import { type ReactNode } from 'react';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Outfit, Geist_Mono } from 'next/font/google';
import './globals.css';

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
  metadataBase: new URL('http://localhost:3000/'),
  title: 'SupaChat — AI Chat Starter for Next.js & Supabase',
  description:
    'Open-source AI chat starter: Supabase SSR auth, Claude-powered chat with document RAG, artifacts, memory, charts, PDF generation and per-token usage dashboards.'
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
