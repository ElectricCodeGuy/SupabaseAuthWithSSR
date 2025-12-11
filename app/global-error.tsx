'use client';

import { Inter } from 'next/font/google';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: false,
  variable: '--font-Inter'
});

export default function GlobalError({ error }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Card className="min-h-screen w-full max-w-md mx-auto flex flex-col items-center justify-center shadow-lg">
          <CardHeader className="text-center space-y-1">
            <div className="p-3 rounded-full bg-destructive/10 w-fit mx-auto mb-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight">
              Something went wrong!
            </h1>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred
            </p>
          </CardHeader>

          <CardContent className="space-y-6 w-full">
            <Alert>
              <AlertDescription>
                Don&apos;t worry, this is a temporary issue. Please try
                refreshing the page.
              </AlertDescription>
            </Alert>

            <Button
              variant="default"
              size="lg"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>

            {process.env.NODE_ENV === 'development' && (
              <Card className="bg-muted/20">
                <CardContent className="pt-6">
                  <pre className="text-xs text-destructive font-mono overflow-auto">
                    {error.message}
                  </pre>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </body>
    </html>
  );
}
