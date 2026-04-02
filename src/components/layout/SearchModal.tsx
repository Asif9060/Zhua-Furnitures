'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { products, formatPrice } from '@/lib/data';
import { useSearchStore } from '@/store';
import styles from './SearchModal.module.css';

export default function SearchModal() {
  const { isOpen, query, close, setQuery } = useSearchStore();

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();
  const results = q
    ? products.filter((product) =>
        product.name.toLowerCase().includes(q) ||
        product.subcategory.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q)
      )
    : products.slice(0, 6);

  return (
    <div className={styles.overlay} onClick={close}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <Search size={18} className={styles.searchIcon} />
          <input
            autoFocus
            className={styles.input}
            placeholder="Search furniture, curtains, accessories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className={styles.closeBtn} onClick={close} aria-label="Close search">
            <X size={16} />
          </button>
        </div>

        <div className={styles.content}>
          {results.length === 0 ? (
            <p className={styles.empty}>No products found for &quot;{query}&quot;.</p>
          ) : (
            results.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className={styles.result}
                onClick={close}
              >
                <div>
                  <p className={styles.resultName}>{product.name}</p>
                  <p className={styles.resultMeta}>{product.subcategory}</p>
                </div>
                <span className={styles.resultPrice}>{formatPrice(product.price)}</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
