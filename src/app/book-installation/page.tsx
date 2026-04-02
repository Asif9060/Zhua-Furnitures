'use client';
import { useState } from 'react';
import { products } from '@/lib/data';

const slots = ['08:00 - 10:00', '10:00 - 12:00', '13:00 - 15:00', '15:00 - 17:00'];

export default function BookInstallationPage() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div style={{ padding: '150px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
        <div className="container" style={{ maxWidth: '700px', textAlign: 'center' }}>
          <span className="label-accent">Booking Confirmed</span>
          <h1 className="heading-xl" style={{ color: '#F0E8D5', margin: '1rem 0' }}>Installation Request Received</h1>
          <p style={{ color: '#9A9080', lineHeight: 1.8, marginBottom: '1.2rem' }}>Our scheduling team will confirm your installation slot via WhatsApp and email.</p>
          <a href="https://wa.me/27000000000" target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">Confirm on WhatsApp</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container" style={{ maxWidth: '860px' }}>
        <span className="label-accent">Book Installation</span>
        <h1 className="heading-xl" style={{ color: '#F0E8D5', margin: '1rem 0 1.25rem' }}>Schedule Professional Installation</h1>

        <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} style={{ background: '#1A1714', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 14, padding: '1.2rem', display: 'grid', gap: '0.8rem' }}>
          <div className="form-group">
            <label className="form-label">Product</label>
            <select className="form-select" required>
              <option value="">Select product</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="form-input" placeholder="Street address" required />
          </div>
          <div style={{ display: 'grid', gap: '0.7rem', gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label className="form-label">Preferred Date</label>
              <input type="date" className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">Preferred Time Slot</label>
              <select className="form-select" required>
                <option value="">Select slot</option>
                {slots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
              </select>
            </div>
          </div>
          <button className="btn btn-primary" type="submit" style={{ justifyContent: 'center' }}>Confirm Booking</button>
        </form>
      </div>
    </div>
  );
}
