import { requireAuthenticatedPage } from '@/lib/auth';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireAuthenticatedPage('/auth/login');

  return <>{children}</>;
}
