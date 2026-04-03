import Link from 'next/link';

export default function AccountPage() {
  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container" style={{ maxWidth: '860px' }}>
        <span className="label-accent">My Account</span>
        <h1 className="heading-xl" style={{ color: '#EAF0F8', margin: '1rem 0 1.25rem' }}>Account Dashboard</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <article style={{ background: '#163250', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1rem' }}>
            <h2 style={{ color: '#EAF0F8', fontSize: '1.05rem', marginBottom: '0.4rem' }}>Orders</h2>
            <p style={{ color: '#A9B7C9', fontSize: '0.9rem', marginBottom: '0.8rem' }}>View your order history and statuses.</p>
            <Link href="/account/orders" className="btn btn-outline btn-sm" style={{ justifyContent: 'center' }}>View Orders</Link>
          </article>
          <article style={{ background: '#163250', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1rem' }}>
            <h2 style={{ color: '#EAF0F8', fontSize: '1.05rem', marginBottom: '0.4rem' }}>Wishlist</h2>
            <p style={{ color: '#A9B7C9', fontSize: '0.9rem', marginBottom: '0.8rem' }}>Your saved pieces for future rooms.</p>
            <Link href="/account/wishlist" className="btn btn-outline btn-sm" style={{ justifyContent: 'center' }}>Open Wishlist</Link>
          </article>
        </div>
      </div>
    </div>
  );
}
