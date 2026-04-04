'use client';

import { useActionState } from 'react';
import { loginAdmin, type LoginState } from './actions';
import styles from './page.module.css';

const initialState: LoginState = {};

export default function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, action, pending] = useActionState(loginAdmin, initialState);

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

      {state.error ? <p className={styles.error}>{state.error}</p> : null}

      <button className={styles.button} type="submit" disabled={pending}>
        {pending ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
