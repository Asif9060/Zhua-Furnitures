'use client';
import { useState } from 'react';

const statuses = ['Placed', 'Confirmed', 'Dispatched', 'Out for Delivery', 'Delivered'];

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [currentStep, setCurrentStep] = useState(2);

  const handleTrack = () => {
    if (!orderNumber.trim()) return;
    const normalized = orderNumber.trim().toUpperCase();
    setCurrentStep(normalized.endsWith('9') ? 4 : normalized.endsWith('7') ? 3 : 2);
  };

  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container" style={{ maxWidth: '860px' }}>
        <span className="label-accent">Order Tracking</span>
        <h1 className="heading-xl" style={{ color: '#F0E8D5', margin: '1rem 0 1.25rem' }}>Track Your Delivery</h1>

        <div style={{ background: '#1A1714', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 14, padding: '1.1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <input className="form-input" placeholder="Enter order number (e.g. ZE-2026001)" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} style={{ flex: 1, minWidth: 240 }} />
            <button className="btn btn-primary" onClick={handleTrack}>Track Order</button>
          </div>
        </div>

        <div style={{ background: '#1A1714', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1.15rem' }}>
          <p style={{ color: '#9A9080', marginBottom: '0.9rem' }}>Current progress for <strong style={{ color: '#C9A84C' }}>{orderNumber || 'ZE-2026001'}</strong></p>
          <div style={{ display: 'grid', gap: '0.55rem' }}>
            {statuses.map((status, index) => {
              const active = index <= currentStep;
              return (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: 12, height: 12, borderRadius: 999, background: active ? '#C9A84C' : '#3A3530' }} />
                  <span style={{ color: active ? '#F0E8D5' : '#7C7266', fontSize: '0.95rem' }}>{status}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
