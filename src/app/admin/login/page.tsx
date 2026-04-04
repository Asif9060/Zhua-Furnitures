import LoginForm from './LoginForm';
import styles from './page.module.css';

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirectTo ?? '/admin';

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.kicker}>Secure Access</p>
        <h1 className={styles.title}>Admin Sign In</h1>
        <p className={styles.help}>Sign in with your approved admin account to continue.</p>
        <LoginForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
