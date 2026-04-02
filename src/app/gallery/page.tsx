import { testimonials } from '@/lib/data';

export default function GalleryPage() {
  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container">
        <span className="label-accent">Gallery</span>
        <h1 className="heading-xl" style={{ color: '#F0E8D5', margin: '1rem 0 1.25rem' }}>Before & After Transformations</h1>

        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {testimonials.map((item, index) => (
            <article key={item.id} style={{ background: '#1A1714', border: '1px solid rgba(201,168,76,0.18)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 180 }}>
                <div style={{ background: `linear-gradient(135deg, rgba(201,168,76,0.1), rgba(201,168,76,0.02))`, borderRight: '1px solid rgba(255,255,255,0.08)', padding: '0.8rem' }}>
                  <p style={{ color: '#C9A84C', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Before</p>
                  <div style={{ background: '#252119', borderRadius: 10, height: 120 }} />
                </div>
                <div style={{ background: `linear-gradient(135deg, rgba(78,205,196,0.1), rgba(78,205,196,0.02))`, padding: '0.8rem' }}>
                  <p style={{ color: '#4ECDC4', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>After</p>
                  <div style={{ background: '#2B2721', borderRadius: 10, height: 120 }} />
                </div>
              </div>
              <div style={{ padding: '0.95rem 1rem' }}>
                <h2 style={{ color: '#F0E8D5', fontSize: '1rem', marginBottom: '0.2rem' }}>Project {index + 1}: {item.project}</h2>
                <p style={{ color: '#9A9080', fontSize: '0.9rem' }}>{item.location}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
