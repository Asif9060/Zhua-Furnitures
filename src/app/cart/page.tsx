'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Trash2, Minus, Plus, ArrowRight, Tag } from 'lucide-react';
import { useCartStore } from '@/store';
import { formatPrice } from '@/lib/data';
import styles from './page.module.css';

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCartStore();
  const [promo, setPromo] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const cartTotal = total();
  const discount = promoApplied ? cartTotal * 0.1 : 0;
  const delivery = cartTotal >= 5000 ? 0 : 299;
  const grandTotal = cartTotal - discount + delivery;

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Shopping Cart</h1>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Your cart is empty</p>
            <p className={styles.emptyDesc}>Looks like you haven&apos;t added anything yet.</p>
            <Link href="/shop" className="btn btn-primary">Explore Collection</Link>
          </div>
        ) : (
          <div className={styles.layout}>
            {/* Items */}
            <div className={styles.items}>
              <div className={styles.itemsHeader}>
                <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                <button className={styles.clearBtn} onClick={clearCart}>Clear all</button>
              </div>

              {items.map(item => (
                <div key={`${item.product.id}-${item.selectedColor}`} className={styles.item}>
                  <div className={styles.itemImg} style={{ background: item.product.colors.find(c => c.name === item.selectedColor)?.hex + '30' || '#3A5673' }}>
                    <svg viewBox="0 0 80 60" style={{ width: '100%', height: '100%', padding: '8px' }}>
                      <rect x="5" y="35" width="70" height="18" rx="4" fill={item.product.colors.find(c => c.name === item.selectedColor)?.hex} fillOpacity="0.6" />
                    </svg>
                  </div>
                  <div className={styles.itemInfo}>
                    <Link href={`/product/${item.product.slug}`} className={styles.itemName}>{item.product.name}</Link>
                    <p className={styles.itemVariant}>
                      {item.selectedColor}{item.selectedSize ? ` · ${item.selectedSize}` : ''}{item.selectedFabric ? ` · ${item.selectedFabric}` : ''}
                    </p>
                    <div className={styles.itemActions}>
                      <div className={styles.qtyRow}>
                        <button className={styles.qtyBtn} onClick={() => updateQuantity(item.product.id, item.selectedColor, item.quantity - 1)}><Minus size={13} /></button>
                        <span className={styles.qty}>{item.quantity}</span>
                        <button className={styles.qtyBtn} onClick={() => updateQuantity(item.product.id, item.selectedColor, item.quantity + 1)}><Plus size={13} /></button>
                      </div>
                      <button className={styles.removeBtn} onClick={() => removeItem(item.product.id, item.selectedColor)}><Trash2 size={14} /> Remove</button>
                    </div>
                  </div>
                  <div className={styles.itemPrice}>
                    <div>{formatPrice(item.product.price * item.quantity)}</div>
                    <div className={styles.itemUnitPrice}>{formatPrice(item.product.price)} each</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className={styles.summary}>
              <h3 className={styles.summaryTitle}>Order Summary</h3>

              <div className={styles.promoForm}>
                <div className={styles.promoInput}>
                  <Tag size={14} />
                  <input type="text" placeholder="Promo code" value={promo} onChange={e => setPromo(e.target.value)} className={styles.promoField} />
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => { if (promo) setPromoApplied(true); }}>Apply</button>
              </div>
              {promoApplied && <p className={styles.promoSuccess}>🎉 10% discount applied!</p>}

              <div className={styles.summaryRows}>
                <div className={styles.row}><span>Subtotal</span><span>{formatPrice(cartTotal)}</span></div>
                {promoApplied && <div className={styles.row} style={{ color: '#4ECDC4' }}><span>Promo (10%)</span><span>−{formatPrice(discount)}</span></div>}
                <div className={styles.row}><span>Delivery</span><span>{delivery === 0 ? <span style={{ color: '#4ECDC4' }}>FREE</span> : formatPrice(delivery)}</span></div>
                <div className={`${styles.row} ${styles.totalRow}`}><span>Total</span><span className={styles.total}>{formatPrice(grandTotal)}</span></div>
              </div>

              <Link href="/checkout" className="btn btn-primary" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                Checkout <ArrowRight size={16} />
              </Link>
              <p className={styles.summaryNote}>Taxes included · Secure checkout powered by PayFast & Yoco</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
