import Link from '@/components/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Terminal } from 'lucide-react';

export function CTA({ session }: { session: boolean }) {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Clone it. Run one SQL file. Ship.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-lg text-muted-foreground">
          The whole stack — auth, chat, tools, dashboards — is a git clone and
          a Supabase project away.
        </p>

        <div className="mx-auto mt-8 flex max-w-xl items-center gap-3 overflow-x-auto rounded-lg border bg-muted/40 px-4 py-3 text-left font-mono text-sm">
          <Terminal className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <code className="whitespace-nowrap">
            git clone https://github.com/ElectricCodeGuy/SupabaseAuthWithSSR.git
          </code>
        </div>

        <div className="mt-8">
          <Button asChild size="lg">
            <Link href={session ? '/chat' : '/signup'} prefetch={false}>
              <span>{session ? 'Open the app' : 'Create your account'}</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
