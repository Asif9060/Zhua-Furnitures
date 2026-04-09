import type { Metadata } from 'next';
import './globals.css';
import ClientChrome from '@/components/layout/ClientChrome';
import AppToaster from '@/components/ui/AppToaster';

export const metadata: Metadata = {
  title: {
    default: 'Zhua Enterprises — Premium Furniture, Curtains & Interior Design | South Africa',
    template: '%s | Zhua Enterprises',
  },
  description: "South Africa's #1 home solutions platform. Shop premium furniture, custom curtains & blinds, and professional interior design services. Delivered across all 9 provinces.",
  keywords: ['furniture South Africa', 'curtains', 'blinds', 'interior design', 'home decor', 'Johannesburg furniture', 'Cape Town curtains'],
  icons: {
    icon: '/logo.jpg?v=2',
    shortcut: '/logo.jpg?v=2',
    apple: '/logo.jpg?v=2',
  },
  openGraph: {
    title: 'Zhua Enterprises — Premium Home Solutions',
    description: "South Africa's #1 home solutions platform",
    type: 'website',
    locale: 'en_ZA',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" data-scroll-behavior="smooth">
      <body suppressHydrationWarning>
        <AppToaster />
        <ClientChrome>{children}</ClientChrome>
      </body>
    </html>
  );
}
