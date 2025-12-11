'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, MessageSquare } from 'lucide-react';

export default function Error({
  error
}: {
  error: Error & { digest?: string };
}) {
  return (
    <Card className="min-h-screen w-full max-w-lg mx-auto flex flex-col items-center justify-center shadow-lg">
      <CardHeader className="text-center space-y-1">
        <div className="p-3 rounded-full bg-destructive/10 w-fit mx-auto mb-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight">
          Oops! Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground">
          We encountered an error during your chat session
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <Alert>
          <MessageSquare className="h-4 w-4" />
          <AlertTitle>What happened?</AlertTitle>
          <AlertDescription>
            The error could be due to temporary problems with our AI service,
            network connectivity issues, or high system load.
          </AlertDescription>
        </Alert>

        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            Temporary problems with the AI service
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            Network connection problems
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            High system load
          </li>
        </ul>

        <div className="flex flex-col sm:flex-row gap-3">
          <a href="/chat" className="flex-1">
            <Button className="w-full" size="lg">
              <MessageSquare className="mr-2 h-4 w-4" />
              Start new conversation
            </Button>
          </a>
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.location.reload()}
            className="flex-1"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>

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
  );
}
