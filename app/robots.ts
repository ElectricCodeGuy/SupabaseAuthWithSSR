import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Signed-in app (chat, files, usage, settings, profile, admin), API
      // routes and the auth redirect flow. /shared-chat/* is left crawlable on
      // purpose: those pages send `noindex`, which crawlers can only honour
      // if they are allowed to fetch the page.
      disallow: ['/chat', '/api/', '/redirect/']
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  };
}
