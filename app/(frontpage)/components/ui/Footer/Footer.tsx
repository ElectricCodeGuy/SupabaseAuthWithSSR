'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import Link from '@/components/link';
import { Github } from '@/components/brand-icons';
import Logo from '../Navbar/Logo';

const GITHUB_URL = 'https://github.com/ElectricCodeGuy/SupabaseAuthWithSSR';

const productLinks = [
  { label: 'AI Chat', href: '/chat' },
  { label: 'Files', href: '/filer' },
  { label: 'Usage', href: '/usage' },
  { label: 'Profile', href: '/profile' }
];

const resourceLinks = [
  { label: 'GitHub', href: GITHUB_URL, external: true },
  { label: 'Next.js', href: 'https://nextjs.org', external: true },
  { label: 'Supabase', href: 'https://supabase.com', external: true },
  { label: 'AI SDK', href: 'https://sdk.vercel.ai', external: true }
];

const Footer: React.FC = () => {
  const pathname = usePathname();

  // Chat pages own the full viewport — no footer there.
  if (pathname === '/chat' || /^\/chat\/[^/]+$/.test(pathname)) {
    return null;
  }

  return (
    <footer className="mt-auto border-t bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          {/* Brand */}
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center">
              <Logo />
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              The open-source AI chat starter for Next.js and Supabase — auth,
              RAG, artifacts, memory and usage analytics, ready to ship.
            </p>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="h-4 w-4" />
              <span>Star on GitHub</span>
            </a>
          </div>

          {/* Link columns */}
          <div className="flex gap-16">
            <nav aria-label="Product">
              <h5 className="text-sm font-semibold">Product</h5>
              <ul className="mt-3 space-y-2">
                {productLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      prefetch={false}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label="Resources">
              <h5 className="text-sm font-semibold">Resources</h5>
              <ul className="mt-3 space-y-2">
                {resourceLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} SupabaseAuthWithSSR · MIT licensed
          </p>
          <p>Built with Next.js, Supabase &amp; Claude</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
