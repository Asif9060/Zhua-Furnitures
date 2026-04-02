'use client';
import Link from 'next/link';
import { products, formatPrice } from '@/lib/data';
import { useWishlistStore, useCartStore } from '@/store';

export default function WishlistPage() {
  const { ids, toggle } = useWishlistStore();
  const { addItem } = useCartStore();
  const wishedProducts = products.filter((product) => ids.includes(product.id));

  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container">
        <span className="label-accent">Account</span>
        <h1 className="heading-xl" style={{ color: '#F0E8D5', margin: '1rem 0 1.25rem' }}>Wishlist</h1>

        {wishedProducts.length === 0 ? (
          <div style={{ background: '#1A1714', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1.2rem' }}>
            <p style={{ color: '#9A9080', marginBottom: '0.8rem' }}>No saved items yet.</p>
            <Link href="/shop" className="btn btn-primary btn-sm">Browse Shop</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {wishedProducts.map((product) => (
              <article key={product.id} style={{ background: '#1A1714', border: '1px solid rgba(201,168,76,0.18)', borderRadius: 14, padding: '1rem', display: 'grid', gap: '0.7rem' }}>
                <h2 style={{ color: '#F0E8D5', fontSize: '1rem' }}>{product.name}</h2>
                <p style={{ color: '#9A9080', fontSize: '0.88rem' }}>{product.subcategory}</p>
                <p style={{ color: '#C9A84C', fontWeight: 600 }}>{formatPrice(product.price)}</p>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => addItem({ product, quantity: 1, selectedColor: product.colors[0].name })}>Add to Cart</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggle(product.id)}>Remove</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
