'use client';

import { MessageCircle } from 'lucide-react';
import styles from './WhatsAppFloat.module.css';

export default function WhatsAppFloat() {
  const phone = '27000000000';
  const message = encodeURIComponent("Hi! I'm interested in your furniture and curtains. Can you help me?");
  const href = `https://wa.me/${phone}?text=${message}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.float}
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={26} fill="white" />
      <span className={styles.tooltip}>Chat on WhatsApp</span>
    </a>
  );
}
