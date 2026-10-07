// Single source of truth for public site identity — used by the root
// metadata, robots.txt, sitemap.xml and the landing page's JSON-LD.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.supa-chat.dev'
).replace(/\/+$/, '');

export const SITE_NAME = 'SupaChat';

export const SITE_TITLE = 'SupaChat — AI Chat Starter for Next.js & Supabase';

export const SITE_DESCRIPTION =
  'Open-source AI chat starter: Supabase SSR auth, Claude-powered chat with document RAG, artifacts, memory, charts, PDF generation and per-token usage dashboards.';

export const REPO_URL =
  'https://github.com/ElectricCodeGuy/SupabaseAuthWithSSR';

export const AUTHOR = {
  name: 'Oscar Lauge Hoffmann',
  url: 'https://www.olh.dk'
} as const;
