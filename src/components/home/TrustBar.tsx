'use client';
import { ShieldCheck, Truck, Star, Leaf } from 'lucide-react';
import styles from './TrustBar.module.css';

const items = [
  { icon: Truck, text: 'Free Delivery on orders over R5,000' },
  { icon: ShieldCheck, text: 'Secure checkout — SSL encrypted' },
  { icon: Star, text: '4.9★ Average customer rating' },
  { icon: Leaf, text: 'Proudly South African' },
];

export default function TrustBar() {
  return (
    <div className={styles.bar}>
      <div className="container-wide">
        <div className={styles.inner}>
          {items.map(({ icon: Icon, text }) => (
            <div key={text} className={styles.item}>
              <Icon size={16} className={styles.icon} />
              <span className={styles.text}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
