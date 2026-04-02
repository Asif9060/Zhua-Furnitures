'use client';

import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';

export default function ContactPage() {
  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        <span className="label-accent">Contact</span>
        <h1 className="heading-xl" style={{ color: '#F0E8D5', margin: '1rem 0 1.25rem' }}>Talk to the Zhua Team</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1rem' }}>
          <div style={{ background: '#1A1714', border: '1px solid rgba(201,168,76,0.18)', borderRadius: 14, padding: '1.25rem' }}>
            <h2 className="heading-md" style={{ color: '#F0E8D5', marginBottom: '1rem' }}>Send a Message</h2>
            <form style={{ display: 'grid', gap: '0.8rem' }} onSubmit={(e) => e.preventDefault()}>
              <input className="form-input" placeholder="Full name" />
              <input className="form-input" type="email" placeholder="Email address" />
              <input className="form-input" placeholder="Phone number" />
              <textarea className="form-input" rows={5} placeholder="How can we help?" />
              <button className="btn btn-primary" type="submit" style={{ justifyContent: 'center' }}>Submit Enquiry</button>
            </form>
          </div>

          <aside style={{ display: 'grid', gap: '0.8rem' }}>
            {[
              { icon: Phone, title: 'Phone', value: '+27 (0) 00 000 0000' },
              { icon: Mail, title: 'Email', value: 'hello@zhuaenterprises.co.za' },
              { icon: MapPin, title: 'Location', value: 'Johannesburg, South Africa' },
            ].map(({ icon: Icon, title, value }) => (
              <div key={title} style={{ background: '#1A1714', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.3rem' }}>
                  <Icon size={14} color="#C9A84C" />
                  <span style={{ color: '#F0E8D5', fontWeight: 600, fontSize: '0.9rem' }}>{title}</span>
                </div>
                <p style={{ color: '#9A9080', fontSize: '0.9rem' }}>{value}</p>
              </div>
            ))}
            <a href="https://wa.me/27000000000" target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp" style={{ justifyContent: 'center' }}>
              <MessageCircle size={16} /> Chat on WhatsApp
            </a>
          </aside>
        </div>
      </div>
    </div>
  );
}
