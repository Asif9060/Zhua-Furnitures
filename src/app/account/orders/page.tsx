const orders = [
  { id: 'ZE-2026001', date: '2026-03-20', total: 'R 24,999', status: 'Confirmed' },
  { id: 'ZE-2025982', date: '2026-02-14', total: 'R 8,900', status: 'Delivered' },
];

export default function OrdersPage() {
  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        <span className="label-accent">Account</span>
        <h1 className="heading-xl" style={{ color: '#EAF0F8', margin: '1rem 0 1.25rem' }}>Order History</h1>

        <div style={{ background: '#163250', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: '0.6rem', padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#B59241', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <span>Order</span><span>Date</span><span>Total</span><span>Status</span>
          </div>
          {orders.map((order) => (
            <div key={order.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: '0.6rem', padding: '0.95rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#EAF0F8' }}>{order.id}</span>
              <span style={{ color: '#A9B7C9' }}>{order.date}</span>
              <span style={{ color: '#EAF0F8' }}>{order.total}</span>
              <span style={{ color: order.status === 'Delivered' ? '#4ECDC4' : '#B59241' }}>{order.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
