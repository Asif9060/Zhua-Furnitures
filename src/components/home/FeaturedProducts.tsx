'use client';
import Link from 'next/link';
import { Heart, ShoppingBag, Star, ArrowRight } from 'lucide-react';
import { products, formatPrice } from '@/lib/data';
import { useCartStore, useWishlistStore } from '@/store';
import styles from './FeaturedProducts.module.css';

export default function FeaturedProducts() {
  const featured = products.slice(0, 6);
  const { addItem } = useCartStore();
  const { toggle, has } = useWishlistStore();

  const handleAddToCart = (product: typeof products[0], e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      product,
      quantity: 1,
      selectedColor: product.colors[0].name,
      selectedSize: product.sizes?.[0],
    });
  };

  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <span className="label-accent">Handpicked for You</span>
            <div className="gold-divider" style={{ margin: '0.75rem 0 1rem' }} />
            <h2 className="heading-xl">Featured Collection</h2>
          </div>
          <Link href="/shop" className="btn btn-outline btn-sm">
            View All <ArrowRight size={15} />
          </Link>
        </div>

        <div className={styles.grid}>
          {featured.map((product) => (
            <Link key={product.id} href={`/product/${product.slug}`} className={styles.card}>
              {/* Image */}
              <div className={styles.imageWrap}>
                <div className={styles.imagePlaceholder}>
                  <ProductVisual category={product.category} color={product.colors[0].hex} />
                </div>

                {/* Badges */}
                {product.badge && (
                  <div className={styles.badges}>
                    <span className={`badge badge-${product.badge}`}>
                      {product.badge === 'bestseller' ? '🏆 Bestseller' : product.badge.charAt(0).toUpperCase() + product.badge.slice(1)}
                    </span>
                  </div>
                )}

                {/* Actions overlay */}
                <div className={styles.actions}>
                  <button
                    className={`${styles.actionBtn} ${has(product.id) ? styles.actionBtnActive : ''}`}
                    onClick={(e) => { e.preventDefault(); toggle(product.id); }}
                    aria-label="Add to wishlist"
                  >
                    <Heart size={16} fill={has(product.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Quick add */}
                <button
                  className={styles.quickAdd}
                  onClick={(e) => handleAddToCart(product, e)}
                  aria-label="Add to cart"
                >
                  <ShoppingBag size={14} /> Add to Cart
                </button>
              </div>

              {/* Info */}
              <div className={styles.info}>
                <p className={styles.category}>{product.subcategory}</p>
                <h3 className={styles.name}>{product.name}</h3>
                <div className={styles.ratingRow}>
                  <div className={styles.stars}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={11} fill={i < Math.floor(product.rating) ? '#C9A84C' : 'none'} color="#C9A84C" />
                    ))}
                  </div>
                  <span className={styles.ratingText}>({product.reviewCount})</span>
                </div>
                <div className={styles.priceRow}>
                  <span className={styles.price}>{formatPrice(product.price)}</span>
                  {product.originalPrice && (
                    <span className={styles.originalPrice}>{formatPrice(product.originalPrice)}</span>
                  )}
                </div>
                {product.isCustomizable && (
                  <span className={styles.customBadge}>✦ Customisable</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductVisual({ category, color }: { category: string; color: string }) {
  if (category === 'furniture') return (
    <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', padding: '16px' }}>
      <rect x="20" y="90" width="160" height="35" rx="6" fill={color} fillOpacity="0.3" />
      <rect x="25" y="60" width="150" height="35" rx="6" fill={color} fillOpacity="0.5" />
      <rect x="20" y="68" width="22" height="55" rx="6" fill={color} fillOpacity="0.6" />
      <rect x="158" y="68" width="22" height="55" rx="6" fill={color} fillOpacity="0.6" />
      <rect x="45" y="95" width="48" height="22" rx="4" fill={color} fillOpacity="0.7" />
      <rect x="107" y="95" width="48" height="22" rx="4" fill={color} fillOpacity="0.7" />
    </svg>
  );
  if (category === 'curtains') return (
    <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', padding: '16px' }}>
      <rect x="15" y="15" width="170" height="6" rx="3" fill={color} fillOpacity="0.5" />
      <path d="M15 21 Q35 55 25 140 L15 140 Z" fill={color} fillOpacity="0.45" />
      <path d="M185 21 Q165 55 175 140 L185 140 Z" fill={color} fillOpacity="0.45" />
      {[30,50,70,90,110,130,150,170].map(x => (
        <circle key={x} cx={x} cy="18" r="4" fill={color} fillOpacity="0.7" />
      ))}
      <rect x="60" y="40" width="80" height="100" fill={color} fillOpacity="0.07" rx="2" />
    </svg>
  );
  return (
    <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', padding: '16px' }}>
      <rect x="95" y="100" width="10" height="40" rx="3" fill={color} fillOpacity="0.4" />
      <rect x="68" y="135" width="64" height="8" rx="3" fill={color} fillOpacity="0.3" />
      <ellipse cx="100" cy="60" rx="35" ry="45" fill={color} fillOpacity="0.2" />
      <ellipse cx="100" cy="60" rx="24" ry="32" fill={color} fillOpacity="0.3" />
      <ellipse cx="100" cy="60" rx="14" ry="18" fill={color} fillOpacity="0.5" />
      <circle cx="100" cy="60" r="7" fill={color} fillOpacity="0.8" />
    </svg>
  );
}
