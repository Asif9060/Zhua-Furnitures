import Link from 'next/link';
import { products, formatPrice } from '@/lib/data';

const curtains = products.filter((product) => product.category === 'curtains');

export default function CurtainsShopPage() {
  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container">
        <span className="label-accent">Shop</span>
        <h1 className="heading-xl" style={{ color: '#EAF0F8', margin: '1rem 0 1.25rem' }}>Curtains & Blinds</h1>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {curtains.map((product) => (
            <Link key={product.id} href={`/product/${product.slug}`} style={{ background: '#163250', border: '1px solid rgba(181,146,65,0.18)', borderRadius: 14, padding: '1rem', display: 'grid', gap: '0.45rem' }}>
              <p style={{ color: '#A9B7C9', fontSize: '0.82rem' }}>{product.subcategory}</p>
              <h2 style={{ color: '#EAF0F8', fontSize: '1rem' }}>{product.name}</h2>
              <p style={{ color: '#B59241', fontWeight: 600 }}>{formatPrice(product.price)}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
