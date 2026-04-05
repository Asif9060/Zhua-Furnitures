'use client';

import { useActionState } from 'react';
import { changePassword, type ChangePasswordState } from './actions';

const initialState: ChangePasswordState = {};

export default function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, initialState);

  return (
    <form action={action} style={{ display: 'grid', gap: '0.8rem' }}>
      <label style={{ color: '#A9B7C9', fontSize: '0.84rem' }}>
        Current Password
        <input className="form-input" name="currentPassword" type="password" required />
      </label>
      <label style={{ color: '#A9B7C9', fontSize: '0.84rem' }}>
        New Password
        <input className="form-input" name="newPassword" type="password" minLength={8} required />
      </label>
      <label style={{ color: '#A9B7C9', fontSize: '0.84rem' }}>
        Confirm New Password
        <input className="form-input" name="confirmPassword" type="password" minLength={8} required />
      </label>

      {state.error ? <p style={{ color: '#ffd0d0', margin: 0 }}>{state.error}</p> : null}
      {state.success ? <p style={{ color: '#b6eccf', margin: 0 }}>{state.success}</p> : null}

      <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
        {pending ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  );
}
