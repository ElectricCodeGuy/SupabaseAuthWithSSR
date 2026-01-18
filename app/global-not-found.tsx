import React from 'react';
import { Button } from '@/components/ui/button';
import { FileX, Home } from 'lucide-react';
import { Inter } from 'next/font/google';
import Footer from '@/app/(frontpage)/components/ui/Footer/Footer';
import NavBar from '@/app/(frontpage)/components/ui/Navbar/Header';
import './globals.css';
import { ThemeProvider } from '@/components/ui/theme-provider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: false,
  variable: '--font-Inter'
});

const Custom404: React.FC = () => {
  return (
    <html lang="en" suppressHydrationWarning className={inter.className}>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NavBar />
          <div className="container max-w-sm mx-auto text-center py-20 md:py-40 h-screen">
            <div className="mb-8">
              <FileX className="h-20 w-20 md:h-36 md:w-36 text-primary mx-auto" />
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Oops! We couldn&apos;t find that page.
            </h2>

            <p className="text-muted-foreground mb-2">
              It looks like the page you&apos;re looking for doesn&apos;t exist
              or has been moved.
            </p>

            <p className="text-sm text-muted-foreground mb-8">
              You can try searching for what you need or go back to the
              homepage.
            </p>

            <Button asChild>
              <a href="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </a>
            </Button>
          </div>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
};

export default Custom404;
