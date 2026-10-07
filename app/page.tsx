import 'server-only';

import NavBar from '@/app/components/layout/Navbar/Header';
import Footer from '@/app/components/layout/Footer/Footer';
import { Hero } from '@/app/components/landing/Hero';
import { Features } from '@/app/components/landing/Features';
import { Workspace } from '@/app/components/landing/Workspace';
import { Showcase } from '@/app/components/landing/Showcase';
import { CTA } from '@/app/components/landing/CTA';
import { getSession } from '@/lib/server/supabase';
import type { Metadata } from 'next';
import {
  AUTHOR,
  REPO_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL
} from '@/lib/site';

// Metadata merges shallowly, so openGraph is restated in full here to add
// the url without dropping the layout's fields.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: '/'
  }
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareSourceCode',
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  codeRepository: REPO_URL,
  license: 'https://opensource.org/licenses/MIT',
  programmingLanguage: 'TypeScript',
  runtimePlatform: 'Next.js',
  author: {
    '@type': 'Person',
    '@id': `${AUTHOR.url}/#person`,
    name: AUTHOR.name,
    url: AUTHOR.url
  }
};

export default async function LandingPage() {
  const session = await getSession();
  const isLoggedIn = !!session?.sub;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c')
        }}
      />
      <NavBar />
      <main>
        <Hero session={isLoggedIn} />
        <Features />
        <Workspace />
        <Showcase />
        <CTA session={isLoggedIn} />
      </main>
      <Footer />
    </>
  );
}
