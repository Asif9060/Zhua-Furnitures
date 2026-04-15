import type { MetadataRoute } from 'next';
import { getCanonicalSiteUrl } from '@/lib/site-url';

const canonicalSiteUrl = getCanonicalSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/admin/'],
    },
    sitemap: `${canonicalSiteUrl}/sitemap.xml`,
    host: canonicalSiteUrl,
  };
}