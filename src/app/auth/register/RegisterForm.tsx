'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { registerUser, type UserRegisterState } from './actions';
import styles from '../auth.module.css';

const initialState: UserRegisterState = {};

export default function RegisterForm({ redirectTo }: { redirectTo: string }) {
  const [state, action, pending] = useActionState(registerUser, initialState);

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <label className={styles.label} htmlFor="fullName">
        Full Name
      </label>
      <input className={styles.input} id="fullName" name="fullName" type="text" required />

      <label className={styles.label} htmlFor="email">
        Email
      </label>
      <input className={styles.input} id="email" name="email" type="email" required />

      <label className={styles.label} htmlFor="password">
        Password
      </label>
      <input className={styles.input} id="password" name="password" type="password" minLength={8} required />

      <label className={styles.label} htmlFor="confirmPassword">
        Confirm Password
      </label>
      <input className={styles.input} id="confirmPassword" name="confirmPassword" type="password" minLength={8} required />

      {state.error ? <p className={styles.error}>{state.error}</p> : null}

      <button className={styles.button} type="submit" disabled={pending}>
        {pending ? 'Creating account...' : 'Create Account'}
      </button>

      <div className={styles.links}>
        <Link href="/auth/login" className={styles.link}>
          Already have an account?
        </Link>
        <Link href="/" className={styles.link}>
          Back to home
        </Link>
      </div>
    </form>
  );
}
