import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import SearchModal from '@/components/layout/SearchModal';
import WhatsAppFloat from '@/components/layout/WhatsAppFloat';

export const metadata: Metadata = {
  title: {
    default: 'Zhua Enterprises — Premium Furniture, Curtains & Interior Design | South Africa',
    template: '%s | Zhua Enterprises',
  },
  description: "South Africa's #1 home solutions platform. Shop premium furniture, custom curtains & blinds, and professional interior design services. Delivered across all 9 provinces.",
  keywords: ['furniture South Africa', 'curtains', 'blinds', 'interior design', 'home decor', 'Johannesburg furniture', 'Cape Town curtains'],
  openGraph: {
    title: 'Zhua Enterprises — Premium Home Solutions',
    description: "South Africa's #1 home solutions platform",
    type: 'website',
    locale: 'en_ZA',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA">
      <body suppressHydrationWarning>
        <Navbar />
        <main>{children}</main>
        <Footer />
        <CartDrawer />
        <SearchModal />
        <WhatsAppFloat />
      </body>
    </html>
  );
}
