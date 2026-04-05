import Link from 'next/link';
import styles from '../auth.module.css';
import ResetPasswordForm from './ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.kicker}>Password Recovery</p>
        <h1 className={styles.title}>Reset Password</h1>
        <p className={styles.help}>Enter your email and we will send you a reset link.</p>
        <ResetPasswordForm />

        <div className={styles.links}>
          <Link href="/auth/login" className={styles.link}>
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
