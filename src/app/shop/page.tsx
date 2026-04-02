'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Star, SlidersHorizontal, X } from 'lucide-react';
import { products, categories, formatPrice } from '@/lib/data';
import { useCartStore, useWishlistStore } from '@/store';
import styles from './page.module.css';

const allSubcategories = [...new Set(products.map(p => p.subcategory))];

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const { addItem } = useCartStore();
  const { toggle, has } = useWishlistStore();

  const filtered = products
    .filter(p => selectedCategory === 'all' || p.category === selectedCategory)
    .filter(p => selectedSubcategory === 'all' || p.subcategory === selectedSubcategory)
    .filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.hero}>
        <div className="container">
          <span className="label-accent">Our Collection</span>
          <h1 className={`heading-xl ${styles.heroTitle}`}>Shop All Products</h1>
          <p className={styles.heroDesc}>Premium furniture, curtains, blinds, and home accessories — delivered anywhere in South Africa</p>
        </div>
      </div>

      <div className="container">
        <div className={styles.layout}>
          {/* Sidebar Filters */}
          <aside className={`${styles.sidebar} ${showFilters ? styles.sidebarOpen : ''}`}>
            <div className={styles.filterHeader}>
              <h3 className={styles.filterTitle}>Filters</h3>
              <button className={styles.closeFilters} onClick={() => setShowFilters(false)}><X size={18} /></button>
            </div>

            <div className={styles.filterGroup}>
              <h4 className={styles.filterGroupTitle}>Category</h4>
              {[{ id: 'all', name: 'All Products' }, ...categories].map(cat => (
                <button
                  key={cat.id}
                  className={`${styles.filterOption} ${selectedCategory === cat.id ? styles.filterActive : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className={styles.filterGroup}>
              <h4 className={styles.filterGroupTitle}>Type</h4>
              {['all', ...allSubcategories].map(sub => (
                <button
                  key={sub}
                  className={`${styles.filterOption} ${selectedSubcategory === sub ? styles.filterActive : ''}`}
                  onClick={() => setSelectedSubcategory(sub)}
                >
                  {sub === 'all' ? 'All Types' : sub}
                </button>
              ))}
            </div>

            <div className={styles.filterGroup}>
              <h4 className={styles.filterGroupTitle}>Max Price: {formatPrice(priceRange[1])}</h4>
              <input
                type="range" min={0} max={50000} step={500}
                value={priceRange[1]}
                onChange={e => setPriceRange([0, Number(e.target.value)])}
                className={styles.priceSlider}
              />
              <div className={styles.priceLabels}>
                <span>{formatPrice(0)}</span>
                <span>{formatPrice(50000)}</span>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className={styles.main}>
            {/* Toolbar */}
            <div className={styles.toolbar}>
              <div className={styles.toolbarLeft}>
                <button className={styles.filterToggle} onClick={() => setShowFilters(true)}>
                  <SlidersHorizontal size={16} /> Filters
                </button>
                <span className={styles.resultCount}>{filtered.length} products</span>
              </div>
              <div className={styles.sortWrap}>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className={styles.sortSelect}
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>

            {/* Category Pills */}
            <div className={styles.categoryPills}>
              {[{ id: 'all', name: 'All' }, ...categories].map(cat => (
                <button
                  key={cat.id}
                  className={`${styles.pill} ${selectedCategory === cat.id ? styles.pillActive : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className={styles.grid}>
              {filtered.map(product => (
                <Link key={product.id} href={`/product/${product.slug}`} className={styles.card}>
                  <div className={styles.cardImage}>
                    <div className={styles.cardImageInner}>
                      <ProductSVG cat={product.category} color={product.colors[0].hex} />
                    </div>
                    {product.badge && (
                      <span className={`badge badge-${product.badge} ${styles.cardBadge}`}>
                        {product.badge === 'bestseller' ? '🏆' : ''} {product.badge}
                      </span>
                    )}
                    <div className={styles.cardActions}>
                      <button
                        className={`${styles.cardActionBtn} ${has(product.id) ? styles.wishlisted : ''}`}
                        onClick={e => { e.preventDefault(); toggle(product.id); }}
                      ><Heart size={15} fill={has(product.id) ? 'currentColor' : 'none'} /></button>
                    </div>
                    <button
                      className={styles.cardQuickAdd}
                      onClick={e => { e.preventDefault(); addItem({ product, quantity: 1, selectedColor: product.colors[0].name }); }}
                    ><ShoppingBag size={13} /> Add to Cart</button>
                  </div>
                  <div className={styles.cardBody}>
                    <p className={styles.cardSub}>{product.subcategory}</p>
                    <h3 className={styles.cardName}>{product.name}</h3>
                    <div className={styles.cardRating}>
                      {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < Math.floor(product.rating) ? '#C9A84C' : 'none'} color="#C9A84C" />)}
                      <span>({product.reviewCount})</span>
                    </div>
                    <div className={styles.cardPrice}>
                      <span className={styles.price}>{formatPrice(product.price)}</span>
                      {product.originalPrice && <span className={styles.original}>{formatPrice(product.originalPrice)}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className={styles.empty}>
                <p>No products match your filters.</p>
                <button className="btn btn-outline btn-sm" onClick={() => { setSelectedCategory('all'); setSelectedSubcategory('all'); setPriceRange([0, 50000]); }}>
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductSVG({ cat, color }: { cat: string; color: string }) {
  if (cat === 'furniture') return (
    <svg viewBox="0 0 200 150" style={{ width: '100%', height: '100%', padding: '12px' }}>
      <rect x="20" y="90" width="160" height="35" rx="6" fill={color} fillOpacity="0.25" />
      <rect x="25" y="60" width="150" height="34" rx="6" fill={color} fillOpacity="0.4" />
      <rect x="20" y="68" width="18" height="55" rx="5" fill={color} fillOpacity="0.5" />
      <rect x="162" y="68" width="18" height="55" rx="5" fill={color} fillOpacity="0.5" />
      <rect x="38" y="94" width="54" height="24" rx="4" fill={color} fillOpacity="0.6" />
      <rect x="108" y="94" width="54" height="24" rx="4" fill={color} fillOpacity="0.6" />
    </svg>
  );
  if (cat === 'curtains') return (
    <svg viewBox="0 0 200 150" style={{ width: '100%', height: '100%', padding: '12px' }}>
      <rect x="15" y="15" width="170" height="6" rx="3" fill={color} fillOpacity="0.5" />
      <path d="M15 21 Q40 60 28 145 L15 145 Z" fill={color} fillOpacity="0.45" />
      <path d="M185 21 Q160 60 172 145 L185 145 Z" fill={color} fillOpacity="0.45" />
      {[25,45,65,85,115,135,155,175].map((x,i) => <circle key={i} cx={x} cy="18" r="5" fill={color} fillOpacity="0.7" />)}
    </svg>
  );
  return (
    <svg viewBox="0 0 200 150" style={{ width: '100%', height: '100%', padding: '12px' }}>
      <rect x="96" y="100" width="8" height="40" rx="3" fill={color} fillOpacity="0.4" />
      <ellipse cx="100" cy="60" rx="32" ry="42" fill={color} fillOpacity="0.15" />
      <ellipse cx="100" cy="60" rx="20" ry="28" fill={color} fillOpacity="0.3" />
      <circle cx="100" cy="60" r="10" fill={color} fillOpacity="0.6" />
    </svg>
  );
}
