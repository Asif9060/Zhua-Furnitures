'use client';
import styles from './HowItWorks.module.css';
import { Search, Palette, Truck, CheckCircle } from 'lucide-react';

const steps = [
  { icon: Search, number: '01', title: 'Browse & Discover', desc: 'Explore thousands of premium furniture, curtains, and home accessories curated by our design team.', color: '#B59241' },
  { icon: Palette, number: '02', title: 'Customise', desc: 'Use our Design Studio to visualize pieces in your room, customise fabrics, colors, and sizes.', color: '#4ECDC4' },
  { icon: CheckCircle, number: '03', title: 'Order & Pay', desc: 'Secure checkout with Yoco, PayFast (coming soon), or Payflex — including Buy Now Pay Later options.', color: '#B39DDB' },
  { icon: Truck, number: '04', title: 'Delivered & Installed', desc: 'We deliver across all 9 provinces. Book professional installation — we handle everything.', color: '#FF8A65' },
];

export default function HowItWorks() {
  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <div className="section-header" style={{ textAlign: 'center' }}>
          <span className="label-accent">Simple Process</span>
          <div className="gold-divider" style={{ margin: '0.75rem auto 1rem' }} />
          <h2 className="heading-xl">How It Works</h2>
        </div>

        <div className={styles.grid}>
          {steps.map((step, i) => (
            <div key={step.number} className={styles.step}>
              <div className={styles.stepNumber} style={{ color: step.color + '30' }}>{step.number}</div>
              <div className={styles.iconWrap} style={{ background: step.color + '12', border: `1px solid ${step.color}25` }}>
                <step.icon size={26} color={step.color} />
              </div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.desc}</p>
              {i < steps.length - 1 && <div className={styles.connector} />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
