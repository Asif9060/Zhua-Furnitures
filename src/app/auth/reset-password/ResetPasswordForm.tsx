'use client';

import { useActionState } from 'react';
import { requestPasswordReset, type ResetPasswordState } from './actions';
import styles from '../auth.module.css';

const initialState: ResetPasswordState = {};

export default function ResetPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <form action={action} className={styles.form}>
      <label className={styles.label} htmlFor="email">
        Email
      </label>
      <input className={styles.input} id="email" name="email" type="email" required />

      {state.error ? <p className={styles.error}>{state.error}</p> : null}
      {state.success ? <p className={styles.info}>{state.success}</p> : null}

      <button className={styles.button} type="submit" disabled={pending}>
        {pending ? 'Sending...' : 'Send Reset Link'}
      </button>
    </form>
  );
}
