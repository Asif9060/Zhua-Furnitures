'use client';
import { useState } from 'react';
import { Star, Quote } from 'lucide-react';
import { testimonials } from '@/lib/data';
import styles from './Testimonials.module.css';

export default function Testimonials() {
  const [active, setActive] = useState(0);
  const t = testimonials[active];

  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <div className={styles.inner}>
          <div className={styles.left}>
            <span className="label-accent">Real Clients, Real Rooms</span>
            <div className="gold-divider" style={{ margin: '0.75rem 0 1rem' }} />
            <h2 className="heading-xl" style={{ color: '#EAF0F8', marginBottom: '2rem' }}>
              What Our Clients Say
            </h2>
            <div className={styles.thumbs}>
              {testimonials.map((t, i) => (
                <button
                  key={t.id}
                  className={`${styles.thumb} ${i === active ? styles.thumbActive : ''}`}
                  onClick={() => setActive(i)}
                  aria-label={`View testimonial from ${t.name}`}
                >
                  <div className={styles.thumbAvatar} style={{ background: `hsl(${i * 60 + 20}, 40%, 40%)` }}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className={styles.thumbName}>{t.name}</div>
                    <div className={styles.thumbLoc}>{t.location}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.right}>
            <div className={styles.quoteCard} key={active}>
              <Quote size={36} className={styles.quoteIcon} />
              <div className={styles.stars}>
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} size={16} fill="#B59241" color="#B59241" />
                ))}
              </div>
              <blockquote className={styles.quoteText}>&ldquo;{t.text}&rdquo;</blockquote>
              <div className={styles.quoteAuthor}>
                <div className={styles.authorAvatar} style={{ background: `hsl(${active * 60 + 20}, 40%, 40%)` }}>
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className={styles.authorName}>{t.name}</div>
                  <div className={styles.authorMeta}>{t.location} · {t.project}</div>
                </div>
              </div>
            </div>

            <div className={styles.dots}>
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  className={`${styles.dot} ${i === active ? styles.dotActive : ''}`}
                  onClick={() => setActive(i)}
                  aria-label={`Testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
