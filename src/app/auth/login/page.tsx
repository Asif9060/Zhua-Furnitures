import LoginForm from './LoginForm';
import { redirect } from 'next/navigation';
import { getOptionalUser } from '@/lib/auth';
import styles from '../auth.module.css';

export default async function UserLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; registered?: string }>;
}) {
  const user = await getOptionalUser();
  if (user) {
    redirect('/account');
  }

  const params = await searchParams;
  const redirectTo = params.redirectTo ?? '/account';
  const registered = params.registered === '1';

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.kicker}>Secure Access</p>
        <h1 className={styles.title}>Customer Sign In</h1>
        <p className={styles.help}>Sign in to view your profile, orders, and wishlist.</p>
        <LoginForm redirectTo={redirectTo} registered={registered} />
      </div>
    </div>
  );
}
