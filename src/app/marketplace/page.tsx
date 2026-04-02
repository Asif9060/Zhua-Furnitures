export default function MarketplacePage() {
  return (
    <div style={{ padding: '150px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container" style={{ maxWidth: '720px', textAlign: 'center' }}>
        <span className="label-accent">Marketplace</span>
        <h1 className="heading-xl" style={{ color: '#F0E8D5', margin: '1rem 0' }}>Vendor Portal Coming Soon</h1>
        <p style={{ color: '#9A9080', lineHeight: 1.8, marginBottom: '1.5rem' }}>
          We are preparing a curated marketplace where verified South African makers and decor studios can list premium products on Zhua.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
          <a href="mailto:hello@zhuaenterprises.co.za" className="btn btn-outline">Join Waitlist</a>
          <a href="/contact" className="btn btn-primary">Contact Team</a>
        </div>
      </div>
    </div>
  );
}
