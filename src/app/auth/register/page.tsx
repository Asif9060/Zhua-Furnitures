import RegisterForm from './RegisterForm';
import { redirect } from 'next/navigation';
import { getOptionalUser } from '@/lib/auth';
import styles from '../auth.module.css';

export default async function UserRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const user = await getOptionalUser();
  if (user) {
    redirect('/account');
  }

  const params = await searchParams;
  const redirectTo = params.redirectTo ?? '/account';

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.kicker}>Create Account</p>
        <h1 className={styles.title}>Join Zhua Furniture</h1>
        <p className={styles.help}>Register to save products, manage orders, and access your profile.</p>
        <RegisterForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
