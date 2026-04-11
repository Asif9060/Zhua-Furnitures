import type { Metadata } from 'next';
import HeroBanner from '@/components/home/HeroBanner';
import TrustBar from '@/components/home/TrustBar';
import CategoryCards from '@/components/home/CategoryCards';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import DesignStudioPromo from '@/components/home/DesignStudioPromo';
import HowItWorks from '@/components/home/HowItWorks';
import Testimonials from '@/components/home/Testimonials';

export const metadata: Metadata = {
  title: 'Zhua Furniture — Premium Furniture, Curtains & Interior Design | South Africa',
  description: "South Africa's #1 home solutions platform. Shop premium furniture, custom curtains & blinds, and professional interior design services across all 9 provinces.",
};

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <TrustBar />
      <CategoryCards />
      <FeaturedProducts />
      <DesignStudioPromo />
      <HowItWorks />
      <Testimonials />
    </>
  );
}
