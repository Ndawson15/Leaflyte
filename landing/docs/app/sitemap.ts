import type { MetadataRoute } from 'next';
import { getAllDocSlugs } from '@/lib/docs';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const slugs = getAllDocSlugs();

  return [
    {
      url: 'https://leaflyte.app/docs/',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...slugs.map((slugParts) => ({
      url: `https://leaflyte.app/docs/${slugParts.join('/')}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
