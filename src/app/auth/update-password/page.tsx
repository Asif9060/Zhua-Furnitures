'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import styles from '../auth.module.css';

export default function UpdatePasswordPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setPending(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

    if (updateError) {
      setError(updateError.message);
      setPending(false);
      return;
    }

    setSuccess('Password updated. You can now sign in with your new password.');
    setPending(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.kicker}>Secure Access</p>
        <h1 className={styles.title}>Set New Password</h1>
        <p className={styles.help}>Choose a strong new password for your account.</p>

        <form className={styles.form} onSubmit={onSubmit}>
          <label className={styles.label} htmlFor="new-password">
            New Password
          </label>
          <input
            id="new-password"
            className={styles.input}
            type="password"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <label className={styles.label} htmlFor="confirm-password">
            Confirm New Password
          </label>
          <input
            id="confirm-password"
            className={styles.input}
            type="password"
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error ? <p className={styles.error}>{error}</p> : null}
          {success ? <p className={styles.info}>{success}</p> : null}

          <button className={styles.button} type="submit" disabled={pending}>
            {pending ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        <div className={styles.links}>
          <Link href="/auth/login" className={styles.link}>
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
