import type { Metadata } from 'next';
import AdminLayout from '@/components/admin/AdminLayout';
import { getOptionalUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Admin Panel',
  description: 'Frontend-only admin panel for operations and content control.',
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getOptionalUser();
  return <AdminLayout userEmail={user?.email}>{children}</AdminLayout>;
}
