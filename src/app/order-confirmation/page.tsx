import Link from 'next/link';
import { CheckCircle, Package, Truck, MessageCircle } from 'lucide-react';

export default function OrderConfirmationPage() {
  const orderNum = 'ZE-2026001';
  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container" style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, background: 'rgba(78,205,196,0.1)', border: '1px solid rgba(78,205,196,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
          <CheckCircle size={40} color="#4ECDC4" />
        </div>
        <span className="label-accent">Order Confirmed!</span>
        <h1 className="heading-xl" style={{ color: '#EAF0F8', margin: '1rem 0', fontSize: '2.5rem' }}>Thank You for Your Order</h1>
        <p style={{ color: '#A9B7C9', fontSize: '1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
          Your order <strong style={{ color: '#B59241' }}>{orderNum}</strong> has been received and is being processed. You&apos;ll receive an email confirmation shortly.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2.5rem' }}>
          {[
            { icon: Package, label: 'Processing', status: 'Active', color: '#B59241' },
            { icon: Truck, label: 'Dispatched', status: 'Pending', color: '#3A5673' },
            { icon: CheckCircle, label: 'Delivered', status: 'Pending', color: '#3A5673' },
          ].map(({ icon: Icon, label, status, color }) => (
            <div key={label} style={{ padding: '1.25rem', background: '#163250', border: `1px solid ${color}30`, borderRadius: 12 }}>
              <Icon size={24} color={color} style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem', fontWeight: 600, color: color === '#3A5673' ? '#58708A' : '#EAF0F8' }}>{label}</div>
              <div style={{ fontSize: '0.72rem', color: color === '#B59241' ? '#B59241' : '#3A5673', marginTop: 2 }}>{status}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <Link href="/track-order" className="btn btn-primary">Track Your Order</Link>
          <Link href="/shop" className="btn btn-outline">Continue Shopping</Link>
        </div>
        <a href="https://wa.me/27000000000" className="btn btn-whatsapp" style={{ display: 'inline-flex' }}>
          <MessageCircle size={16} /> Questions? Chat on WhatsApp
        </a>
      </div>
    </div>
  );
}
