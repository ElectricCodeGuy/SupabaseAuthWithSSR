'use client';

import { Button } from '@/components/ui/button';
import Link from '@/components/link';
import { AlertTriangle, RefreshCw, MessageSquare } from 'lucide-react';

export default function Error({
  error
}: {
  error: Error & { digest?: string };
}) {
  return (
    <div className="flex min-h-[calc(100dvh-3rem)] w-full flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
      </div>

      <div className="max-w-xl space-y-3">
        <h2 className="text-2xl font-bold tracking-tight">
          Oops! Something went wrong
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground">
          We hit an error during your chat session. This is usually
          temporary&nbsp;— a hiccup with the AI service, a network blip, or high
          load. Try again or start a fresh conversation.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" asChild>
          <Link href="/chat">
            <MessageSquare className="mr-2 h-4 w-4" />
            Start new conversation
          </Link>
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <pre className="mt-2 max-w-xl overflow-auto rounded-md bg-muted/40 p-4 text-left font-mono text-xs text-destructive">
          {error.message}
        </pre>
      )}
    </div>
  );
}
