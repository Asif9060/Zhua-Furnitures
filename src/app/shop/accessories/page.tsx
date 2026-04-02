import Link from 'next/link';
import { products, formatPrice } from '@/lib/data';

const accessories = products.filter((product) => product.category === 'accessories');

export default function AccessoriesShopPage() {
  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container">
        <span className="label-accent">Shop</span>
        <h1 className="heading-xl" style={{ color: '#F0E8D5', margin: '1rem 0 1.25rem' }}>Accessories & Decor</h1>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {accessories.map((product) => (
            <Link key={product.id} href={`/product/${product.slug}`} style={{ background: '#1A1714', border: '1px solid rgba(201,168,76,0.18)', borderRadius: 14, padding: '1rem', display: 'grid', gap: '0.45rem' }}>
              <p style={{ color: '#9A9080', fontSize: '0.82rem' }}>{product.subcategory}</p>
              <h2 style={{ color: '#F0E8D5', fontSize: '1rem' }}>{product.name}</h2>
              <p style={{ color: '#C9A84C', fontWeight: 600 }}>{formatPrice(product.price)}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
