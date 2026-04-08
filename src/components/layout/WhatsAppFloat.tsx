'use client';

import { MessageCircle } from 'lucide-react';
import { buildWhatsAppUrl, DEFAULT_WHATSAPP_MESSAGE } from '@/lib/whatsapp';
import styles from './WhatsAppFloat.module.css';

export default function WhatsAppFloat() {
  const href = buildWhatsAppUrl(DEFAULT_WHATSAPP_MESSAGE);

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
