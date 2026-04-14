import type { Metadata } from 'next';
import './globals.css';
import ClientChrome from '@/components/layout/ClientChrome';
import AppToaster from '@/components/ui/AppToaster';
import FdProcessedIdSanitizer from '@/components/layout/FdProcessedIdSanitizer';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.CANONICAL_SITE_URL ??
      'https://www.zhuafurniture.com'
  ),
  title: {
    default: 'Zhua Furniture — Premium Furniture, Curtains & Interior Design | South Africa',
    template: '%s | Zhua Furniture',
  },
  description: "South Africa's #1 home solutions platform. Shop premium furniture, custom curtains & blinds, and professional interior design services. Delivered across all 9 provinces.",
  keywords: ['furniture South Africa', 'curtains', 'blinds', 'interior design', 'home decor', 'Johannesburg furniture', 'Cape Town curtains'],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Zhua Furniture — Premium Home Solutions',
    description: "South Africa's #1 home solutions platform",
    type: 'website',
    locale: 'en_ZA',
    url: '/',
    siteName: 'Zhua Furniture',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" data-scroll-behavior="smooth">
      <body suppressHydrationWarning>
        <FdProcessedIdSanitizer />
        <AppToaster />
        <ClientChrome>{children}</ClientChrome>
      </body>
    </html>
  );
}
