import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Public, indexable pages only — everything under /chat requires a session.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: 'weekly',
      priority: 1
    },
    {
      url: `${SITE_URL}/signup`,
      changeFrequency: 'yearly',
      priority: 0.5
    },
    {
      url: `${SITE_URL}/signin`,
      changeFrequency: 'yearly',
      priority: 0.3
    }
  ];
}
