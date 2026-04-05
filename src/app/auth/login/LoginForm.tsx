'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { loginUser, type UserLoginState } from './actions';
import styles from '../auth.module.css';

const initialState: UserLoginState = {};

export default function LoginForm({
  redirectTo,
  registered,
}: {
  redirectTo: string;
  registered: boolean;
}) {
  const [state, action, pending] = useActionState(loginUser, initialState);

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <label className={styles.label} htmlFor="email">
        Email
      </label>
      <input className={styles.input} id="email" name="email" type="email" required />

      <label className={styles.label} htmlFor="password">
        Password
      </label>
      <input className={styles.input} id="password" name="password" type="password" required />

      {registered ? <p className={styles.info}>Account created. Sign in to continue.</p> : null}
      {state.error ? <p className={styles.error}>{state.error}</p> : null}

      <button className={styles.button} type="submit" disabled={pending}>
        {pending ? 'Signing in...' : 'Sign In'}
      </button>

      <div className={styles.links}>
        <Link href="/auth/register" className={styles.link}>
          Create an account
        </Link>
        <Link href="/auth/reset-password" className={styles.link}>
          Forgot password?
        </Link>
        <Link href="/" className={styles.link}>
          Back to home
        </Link>
      </div>
    </form>
  );
}
