'use client';
import { useEffect, useState } from 'react';
import { products, formatPrice, deliveryProvinces } from '@/lib/data';
import { useCartStore } from '@/store';
import { ShoppingBag, Heart, Star, ChevronLeft, ChevronRight, Truck, Shield, RotateCcw, MessageCircle, Check } from 'lucide-react';
import Link from 'next/link';
import { useWishlistStore } from '@/store';
import { useParams } from 'next/navigation';
import { useStorefrontProducts } from '@/lib/use-storefront-products';
import styles from './page.module.css';

export default function ProductPage() {
  const { products: liveProducts } = useStorefrontProducts();
  const routeParams = useParams<{ slug: string }>();
  const slug = routeParams?.slug ?? '';
  const product = liveProducts.find((entry) => entry.slug === slug) || liveProducts[0] || products[0];
  const [selectedColorName, setSelectedColorName] = useState(product.colors[0]?.name ?? '');
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '');
  const [selectedFabric, setSelectedFabric] = useState(product.fabrics?.[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [province, setProvince] = useState('');
  const [imgIndex, setImgIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const { addItem } = useCartStore();
  const { toggle, has } = useWishlistStore();

  useEffect(() => {
    void fetch('/api/account/activity/product-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id, slug: product.slug }),
    });
  }, [product.id, product.slug]);

  const selectedColor =
    product.colors.find((entry) => entry.name === selectedColorName) ??
    product.colors[0] ??
    { name: 'Default', hex: '#B59241' };
  const activeSize = product.sizes?.includes(selectedSize) ? selectedSize : product.sizes?.[0] || '';
  const activeFabric = product.fabrics?.includes(selectedFabric)
    ? selectedFabric
    : product.fabrics?.[0] || '';
  const delivery = deliveryProvinces.find(p => p.id === province);

  const handleAddToCart = () => {
    addItem({ product, quantity, selectedColor: selectedColor.name, selectedSize: activeSize, selectedFabric: activeFabric });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const related = liveProducts
    .filter((entry) => entry.category === product.category && entry.id !== product.id)
    .slice(0, 4);
  const weightKg = Number(product.weightKg ?? 0);
  const widthCm = Number(product.dimensions?.widthCm ?? 0);
  const depthCm = Number(product.dimensions?.depthCm ?? 0);
  const heightCm = Number(product.dimensions?.heightCm ?? 0);
  const hasPhysicalSpecs = weightKg > 0 || widthCm > 0 || depthCm > 0 || heightCm > 0;
  const galleryImages = product.images.length > 0 ? product.images : [];
  const imgCount = galleryImages.length > 0 ? galleryImages.length : 3;
  const safeImgIndex = Math.min(imgIndex, Math.max(0, imgCount - 1));

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb}>
          <Link href="/">Home</Link> / <Link href="/shop">Shop</Link> / <Link href={`/shop/${product.category}`}>{product.subcategory}</Link> / <span>{product.name}</span>
        </nav>

        <div className={styles.grid}>
          {/* Gallery */}
          <div className={styles.gallery}>
            <div className={styles.mainImage} style={{ background: `linear-gradient(135deg, ${selectedColor.hex}15, ${selectedColor.hex}08)` }}>
              <div className={styles.mainImageInner}>
                {galleryImages[safeImgIndex] ? (
                  <img
                    src={galleryImages[safeImgIndex]}
                    alt={`${product.name} image ${safeImgIndex + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <ProductHeroSVG category={product.category} color={selectedColor.hex} />
                )}
              </div>
              <button className={styles.galleryNav} onClick={() => setImgIndex(Math.max(0, safeImgIndex - 1))} style={{ left: '0.875rem' }}><ChevronLeft size={18} /></button>
              <button className={styles.galleryNav} onClick={() => setImgIndex(Math.min(imgCount - 1, safeImgIndex + 1))} style={{ right: '0.875rem' }}><ChevronRight size={18} /></button>
              <div className={styles.galleryDots}>
                {[...Array(imgCount)].map((_, i) => (
                  <button key={i} className={`${styles.galleryDot} ${i === safeImgIndex ? styles.galleryDotActive : ''}`} onClick={() => setImgIndex(i)} />
                ))}
              </div>
            </div>
            <div className={styles.thumbnails}>
              {[...Array(imgCount)].map((_, i) => (
                <button key={i} className={`${styles.thumb} ${i === safeImgIndex ? styles.thumbActive : ''}`} onClick={() => setImgIndex(i)}>
                  {galleryImages[i] ? (
                    <img
                      src={galleryImages[i]}
                      alt={`${product.name} thumbnail ${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: `${selectedColor.hex}20` }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className={styles.info}>
            {product.badge && (
              <span className={`badge badge-${product.badge}`}>
                {product.badge === 'bestseller' ? '🏆 Bestseller' : product.badge}
              </span>
            )}
            <h1 className={styles.name}>{product.name}</h1>
            <p className={styles.subcategory}>{product.subcategory}</p>

            <div className={styles.ratingRow}>
              <div className={styles.stars}>
                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < Math.floor(product.rating) ? '#B59241' : 'none'} color="#B59241" />)}
              </div>
              <span className={styles.ratingNum}>{product.rating}</span>
              <Link href="#reviews" className={styles.ratingLink}>({product.reviewCount} reviews)</Link>
            </div>

            <div className={styles.priceBlock}>
              <span className={styles.price}>{formatPrice(product.price)}</span>
              {product.originalPrice && <span className={styles.originalPrice}>{formatPrice(product.originalPrice)}</span>}
            </div>

            <p className={styles.desc}>{product.description}</p>

            {/* Color */}
            <div className={styles.optionGroup}>
              <label className={styles.optionLabel}>Colour: <strong className={styles.optionValue}>{selectedColor.name}</strong></label>
              <div className={styles.colorSwatches}>
                {product.colors.map(c => (
                  <button
                    key={c.name}
                    className={`${styles.colorSwatch} ${c.name === selectedColor.name ? styles.colorSwatchActive : ''}`}
                    style={{ background: c.hex }}
                    onClick={() => setSelectedColorName(c.name)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Size */}
            {product.sizes && (
              <div className={styles.optionGroup}>
                <label className={styles.optionLabel}>Size: <strong className={styles.optionValue}>{activeSize}</strong></label>
                <div className={styles.sizePills}>
                  {product.sizes.map(s => (
                    <button key={s} className={`${styles.sizePill} ${s === activeSize ? styles.sizePillActive : ''}`} onClick={() => setSelectedSize(s)}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Fabric */}
            {product.fabrics && (
              <div className={styles.optionGroup}>
                <label className={styles.optionLabel}>Fabric: <strong className={styles.optionValue}>{activeFabric}</strong></label>
                <div className={styles.sizePills}>
                  {product.fabrics.map(f => (
                    <button key={f} className={`${styles.sizePill} ${f === activeFabric ? styles.sizePillActive : ''}`} onClick={() => setSelectedFabric(f)}>{f}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className={styles.optionGroup}>
              <label className={styles.optionLabel}>Quantity</label>
              <div className={styles.qtyControl}>
                <button className={styles.qtyBtn} onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                <span className={styles.qty}>{quantity}</span>
                <button className={styles.qtyBtn} onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
            </div>

            {/* CTA */}
            <div className={styles.ctaGroup}>
              <button className={`btn btn-primary btn-lg ${styles.cartBtn}`} onClick={handleAddToCart}>
                {added ? <><Check size={18} /> Added!</> : <><ShoppingBag size={18} /> Add to Cart</>}
              </button>
              <button className={`${styles.wishBtn} ${has(product.id) ? styles.wishBtnActive : ''}`} onClick={() => void toggle(product.id)}>
                <Heart size={20} fill={has(product.id) ? 'currentColor' : 'none'} />
              </button>
            </div>

            <a
              href={`https://wa.me/27000000000?text=${encodeURIComponent(`Hi! I'm interested in the ${product.name}. Can you help me?`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp"
              style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}
            >
              <MessageCircle size={16} /> Get a WhatsApp Quote
            </a>

            {/* Payment */}
            <div className={styles.paymentRow}>
              {['PayFast', 'Yoco', 'Payflex BNPL'].map(p => <span key={p} className={styles.payBadge}>{p}</span>)}
            </div>

            {/* Delivery Estimator */}
            <div className={styles.deliveryBox}>
              <div className={styles.deliveryHeader}><Truck size={16} /> Delivery Estimate</div>
              <select className="form-select" value={province} onChange={e => setProvince(e.target.value)}>
                <option value="">Select your province</option>
                {deliveryProvinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {delivery && (
                <div className={styles.deliveryDetails}>
                  <div className={styles.deliveryOption}>
                    <span>Standard</span>
                    <span>{delivery.standardDays} days · {delivery.standardFee === 0 ? 'FREE' : formatPrice(delivery.standardFee)}</span>
                  </div>
                  <div className={styles.deliveryOption}>
                    <span>Express</span>
                    <span>{delivery.expressDays} days · {formatPrice(delivery.expressFee)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Trust icons */}
            <div className={styles.trustIcons}>
              {[{ icon: Shield, label: '5-Year Warranty' }, { icon: RotateCcw, label: '30-Day Returns' }, { icon: Truck, label: 'SA-Wide Delivery' }].map(({ icon: I, label }) => (
                <div key={label} className={styles.trustItem}><I size={14} color="#B59241" /> <span>{label}</span></div>
              ))}
            </div>

            {/* Features */}
            <div className={styles.features}>
              <h4 className={styles.featuresTitle}>What&apos;s Included</h4>
              <ul>
                {product.features.map(f => <li key={f} className={styles.featureItem}><Check size={13} color="#B59241" /> {f}</li>)}
              </ul>
            </div>

            {hasPhysicalSpecs ? (
              <div className={styles.features}>
                <h4 className={styles.featuresTitle}>Physical Specs</h4>
                <ul>
                  {weightKg > 0 ? (
                    <li className={styles.featureItem}><Check size={13} color="#B59241" /> Weight: {weightKg} kg</li>
                  ) : null}
                  {(widthCm > 0 || depthCm > 0 || heightCm > 0) ? (
                    <li className={styles.featureItem}>
                      <Check size={13} color="#B59241" /> Dimensions (cm): W {widthCm} × D {depthCm} × H {heightCm}
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        {/* Related */}
        <div className={styles.related}>
          <h2 className="heading-lg" style={{ color: '#EAF0F8', marginBottom: '2rem' }}>You Might Also Like</h2>
          <div className={styles.relatedGrid}>
            {related.map(p => (
              <Link key={p.id} href={`/product/${p.slug}`} className={styles.relatedCard}>
                <div className={styles.relatedImg} style={{ background: `${p.colors[0].hex}20` }}>
                  {p.images[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <ProductHeroSVG category={p.category} color={p.colors[0].hex} />
                  )}
                </div>
                <h4 className={styles.relatedName}>{p.name}</h4>
                <span className={styles.relatedPrice}>{formatPrice(p.price)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductHeroSVG({ category, color }: { category: string; color: string }) {
  if (category === 'furniture') return (
    <svg viewBox="0 0 300 220" style={{ width: '100%', height: '100%' }}>
      <rect x="30" y="140" width="240" height="50" rx="8" fill={color} fillOpacity="0.25" />
      <rect x="38" y="95" width="224" height="52" rx="8" fill={color} fillOpacity="0.45" />
      <rect x="30" y="108" width="28" height="80" rx="8" fill={color} fillOpacity="0.6" />
      <rect x="242" y="108" width="28" height="80" rx="8" fill={color} fillOpacity="0.6" />
      <rect x="60" y="148" width="80" height="34" rx="6" fill={color} fillOpacity="0.7" />
      <rect x="160" y="148" width="80" height="34" rx="6" fill={color} fillOpacity="0.7" />
    </svg>
  );
  if (category === 'curtains') return (
    <svg viewBox="0 0 300 220" style={{ width: '100%', height: '100%' }}>
      <rect x="20" y="20" width="260" height="8" rx="4" fill={color} fillOpacity="0.5" />
      <path d="M20 28 Q55 90 40 210 L20 210 Z" fill={color} fillOpacity="0.5" />
      <path d="M280 28 Q245 90 260 210 L280 210 Z" fill={color} fillOpacity="0.5" />
      {[35,60,85,110,140,170,195,220,245,270].map((x,i) => <circle key={i} cx={x} cy="24" r="7" fill={color} fillOpacity="0.7" />)}
      <rect x="80" y="50" width="140" height="160" fill={color} fillOpacity="0.06" rx="4" />
    </svg>
  );
  return (
    <svg viewBox="0 0 300 220" style={{ width: '100%', height: '100%' }}>
      <rect x="142" y="155" width="16" height="55" rx="4" fill={color} fillOpacity="0.4" />
      <rect x="100" y="205" width="100" height="12" rx="4" fill={color} fillOpacity="0.25" />
      <ellipse cx="150" cy="90" rx="55" ry="70" fill={color} fillOpacity="0.15" />
      <ellipse cx="150" cy="90" rx="36" ry="48" fill={color} fillOpacity="0.3" />
      <ellipse cx="150" cy="90" rx="20" ry="28" fill={color} fillOpacity="0.5" />
      <circle cx="150" cy="90" r="10" fill={color} fillOpacity="0.9" />
    </svg>
  );
}
