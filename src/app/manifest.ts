import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Zhua Furniture',
    short_name: 'Zhua Furniture',
    description:
      "South Africa's #1 home solutions platform. Shop premium furniture, custom curtains & blinds, and interior design services.",
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f8f8f8',
    theme_color: '#0f2340',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}