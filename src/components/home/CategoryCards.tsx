'use client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import styles from './CategoryCards.module.css';

const categories = [
  {
    id: 'furniture',
    label: 'Furniture',
    desc: 'Sofas, beds, tables & storage — crafted for longevity',
    href: '/shop/furniture',
    count: '84 pieces',
    gradient: 'linear-gradient(135deg, #2A1F14 0%, #3D2E1C 100%)',
    accent: '#C9A84C',
    shapes: ['sofa'],
  },
  {
    id: 'curtains',
    label: 'Curtains & Blinds',
    desc: 'Custom window dressings tailored to every room',
    href: '/shop/curtains',
    count: '126 styles',
    gradient: 'linear-gradient(135deg, #14201A 0%, #1C2F25 100%)',
    accent: '#4ECDC4',
    shapes: ['curtain'],
  },
  {
    id: 'accessories',
    label: 'Home Accessories',
    desc: 'Curated décor objects to complete your interior story',
    href: '/shop/accessories',
    count: '52 items',
    gradient: 'linear-gradient(135deg, #1A1425 0%, #251C35 100%)',
    accent: '#B39DDB',
    shapes: ['lamp'],
  },
];

export default function CategoryCards() {
  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <div className="section-header" style={{ textAlign: 'center' }}>
          <span className="label-accent">Collections</span>
          <div className="gold-divider" style={{ margin: '0.75rem auto 1rem' }} />
          <h2 className="heading-xl">Shop by Category</h2>
        </div>

        <div className={styles.grid}>
          {categories.map((cat) => (
            <Link key={cat.id} href={cat.href} className={styles.card} style={{ background: cat.gradient }}>
              <div className={styles.cardVisual}>
                <CategoryIllustration type={cat.shapes[0]} accent={cat.accent} />
              </div>
              <div className={styles.cardContent}>
                <span className={styles.cardCount} style={{ color: cat.accent }}>{cat.count}</span>
                <h3 className={styles.cardTitle}>{cat.label}</h3>
                <p className={styles.cardDesc}>{cat.desc}</p>
                <div className={styles.cardArrow} style={{ color: cat.accent }}>
                  Shop Now <ArrowRight size={16} />
                </div>
              </div>
              <div className={styles.cardBorder} style={{ borderColor: cat.accent + '30' }} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryIllustration({ type, accent }: { type: string; accent: string }) {
  if (type === 'sofa') return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect x="15" y="45" width="90" height="20" rx="4" fill={accent} fillOpacity="0.2" />
      <rect x="20" y="30" width="80" height="18" rx="4" fill={accent} fillOpacity="0.3" />
      <rect x="15" y="35" width="14" height="28" rx="4" fill={accent} fillOpacity="0.4" />
      <rect x="91" y="35" width="14" height="28" rx="4" fill={accent} fillOpacity="0.4" />
      <rect x="35" y="48" width="22" height="12" rx="3" fill={accent} fillOpacity="0.5" />
      <rect x="63" y="48" width="22" height="12" rx="3" fill={accent} fillOpacity="0.5" />
      <rect x="15" y="65" width="14" height="6" rx="2" fill={accent} fillOpacity="0.3" />
      <rect x="91" y="65" width="14" height="6" rx="2" fill={accent} fillOpacity="0.3" />
    </svg>
  );
  if (type === 'curtain') return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect x="10" y="10" width="2" height="60" fill={accent} fillOpacity="0.3" />
      <rect x="108" y="10" width="2" height="60" fill={accent} fillOpacity="0.3" />
      <rect x="10" y="10" width="100" height="4" rx="2" fill={accent} fillOpacity="0.4" />
      <path d="M10 14 Q25 30 20 70 L10 70 Z" fill={accent} fillOpacity="0.35" />
      <path d="M110 14 Q95 30 100 70 L110 70 Z" fill={accent} fillOpacity="0.35" />
      <rect x="20" y="20" width="3" height="3" rx="1" fill={accent} fillOpacity="0.6" />
      <rect x="35" y="20" width="3" height="3" rx="1" fill={accent} fillOpacity="0.6" />
      <rect x="82" y="20" width="3" height="3" rx="1" fill={accent} fillOpacity="0.6" />
      <rect x="97" y="20" width="3" height="3" rx="1" fill={accent} fillOpacity="0.6" />
      <rect x="40" y="25" width="40" height="45" fill={accent} fillOpacity="0.08" rx="2" />
    </svg>
  );
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect x="57" y="55" width="6" height="20" rx="2" fill={accent} fillOpacity="0.3" />
      <rect x="40" y="73" width="40" height="4" rx="2" fill={accent} fillOpacity="0.2" />
      <ellipse cx="60" cy="35" rx="20" ry="25" fill={accent} fillOpacity="0.15" />
      <ellipse cx="60" cy="35" rx="14" ry="18" fill={accent} fillOpacity="0.2" />
      <ellipse cx="60" cy="35" rx="8" ry="10" fill={accent} fillOpacity="0.4" />
      <circle cx="60" cy="35" r="4" fill={accent} fillOpacity="0.7" />
      <ellipse cx="60" cy="55" rx="8" ry="2" fill={accent} fillOpacity="0.15" />
    </svg>
  );
}
