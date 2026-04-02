const sections = [
  {
    title: 'Shipping & Delivery',
    points: [
      'Standard and express options are available across all 9 provinces.',
      'Large furniture delivery includes scheduled windows and support updates.',
      'Final delivery fees are calculated by province and order dimensions.',
    ],
  },
  {
    title: 'Returns & Refunds',
    points: [
      'Eligible returns are accepted within 30 days for unused, standard items.',
      'Custom-made curtains and bespoke items are non-returnable unless defective.',
      'Approved refunds are processed to the original payment method.',
    ],
  },
  {
    title: 'Privacy Policy',
    points: [
      'Customer details are stored securely and used for order fulfilment only.',
      'We do not sell personal information to third parties.',
      'WhatsApp and email communications may be used for service updates.',
    ],
  },
];

export default function PoliciesPage() {
  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container" style={{ maxWidth: '920px' }}>
        <span className="label-accent">Policies</span>
        <h1 className="heading-xl" style={{ color: '#F0E8D5', margin: '1rem 0 1.25rem' }}>Shipping, Returns & Privacy</h1>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {sections.map((section) => (
            <section key={section.title} style={{ background: '#1A1714', border: '1px solid rgba(201,168,76,0.18)', borderRadius: 14, padding: '1.1rem' }}>
              <h2 className="heading-md" style={{ color: '#F0E8D5', fontSize: '1.2rem', marginBottom: '0.55rem' }}>{section.title}</h2>
              <ul style={{ display: 'grid', gap: '0.45rem', listStyle: 'disc', paddingLeft: '1.2rem', color: '#9A9080' }}>
                {section.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
