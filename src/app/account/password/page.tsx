import { requireAuthenticatedPage } from '@/lib/auth';
import PasswordForm from './PasswordForm';

export default async function AccountPasswordPage() {
  await requireAuthenticatedPage('/auth/login');

  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container" style={{ maxWidth: '860px' }}>
        <span className="label-accent">Account</span>
        <h1 className="heading-xl" style={{ color: '#EAF0F8', margin: '1rem 0 1.25rem' }}>Change Password</h1>

        <article style={{ background: '#163250', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1rem' }}>
          <PasswordForm />
        </article>
      </div>
    </div>
  );
}
