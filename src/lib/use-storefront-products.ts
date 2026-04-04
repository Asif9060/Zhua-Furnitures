'use client';

import { useEffect, useState } from 'react';
import { products as fallbackProducts, type Product } from '@/lib/data';

interface ProductsResponse {
  products?: Product[];
  error?: string;
}

export function useStorefrontProducts() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch('/api/products', { cache: 'no-store' });
        if (!res.ok) {
          return;
        }

        const data = (await res.json()) as ProductsResponse;
        if (Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
        }
      } catch {
        // Fallback data stays in place when live API is unavailable.
      } finally {
        setLoading(false);
      }
    };

    void loadProducts();
  }, []);

  return { products, loading };
}
