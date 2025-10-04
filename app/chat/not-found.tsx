import Link from 'next/link';
import { MessageSquareOff, Home, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ChatNotFound() {
  return (
    <div className="flex h-[calc(100vh-48px)] w-full items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <div className="flex flex-col items-center space-y-8 text-center px-4 max-w-lg">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative rounded-full bg-gradient-to-br from-primary/20 to-primary/5 p-8 border border-primary/20">
            <MessageSquareOff
              className="h-20 w-20 text-primary"
              strokeWidth={1.5}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Chat Not Found
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
            This conversation doesn&apos;t exist or you don&apos;t have access
            to view it.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto pt-2">
          <Button
            asChild
            size="lg"
            className="gap-2 shadow-lg shadow-primary/20"
          >
            <Link href="/chat">
              <Plus className="h-4 w-4" />
              Start New Chat
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>

        <p className="text-sm text-muted-foreground/60 pt-4">
          Need help? Check your chat history or create a new conversation.
        </p>
      </div>
    </div>
  );
}
