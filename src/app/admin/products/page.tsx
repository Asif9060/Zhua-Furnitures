'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/admin-data';
import styles from '../admin-pages.module.css';

interface CloudinaryImageAsset {
  publicId: string;
  secureUrl: string;
  alt: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  createdAt?: string;
}

interface AdminProductRow {
  id: string;
  sku: string;
  slug: string;
  name: string;
  category: 'Furniture' | 'Curtains' | 'Accessories';
  stock: number;
  price: number;
  status: 'Active' | 'Draft' | 'Archived';
  images: CloudinaryImageAsset[];
  primaryImage: string | null;
  imageCount: number;
}

type NewProductState = {
  name: string;
  category: 'Furniture' | 'Curtains' | 'Accessories';
  price: string;
  stock: string;
  description: string;
  longDescription: string;
};

export default function ProductsAdminPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState<NewProductState>({
    name: '',
    category: 'Furniture',
    price: '',
    stock: '',
    description: '',
    longDescription: '',
  });

  const loadProducts = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/products', { cache: 'no-store' });
      const data = (await res.json()) as { products?: AdminProductRow[]; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? 'Could not load products.');
      }

      setProducts(data.products ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load products.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === 'All' || product.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [products, query, category]);

  const updateProduct = async (id: string, partial: Partial<AdminProductRow>) => {
    setSavingId(id);
    setError('');

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      });

      const data = (await res.json()) as { product?: AdminProductRow; error?: string };
      if (!res.ok || !data.product) {
        throw new Error(data.error ?? 'Could not update product.');
      }

      setProducts((prev) => prev.map((product) => (product.id === id ? data.product! : product)));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update product.';
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  const uploadProductImage = async (productId: string, file: File) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Max file size is 10MB.');
      return;
    }

    const target = products.find((row) => row.id === productId);
    if (!target) {
      setError('Product not found.');
      return;
    }

    setUploadingId(productId);
    setError('');

    try {
      const signRes = await fetch('/api/admin/media/sign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder: 'zhua/products',
          baseName: target.name,
        }),
      });

      const signData = (await signRes.json()) as {
        cloudName?: string;
        apiKey?: string;
        timestamp?: number;
        signature?: string;
        folder?: string;
        publicId?: string;
        uploadUrl?: string;
        error?: string;
      };

      if (!signRes.ok || !signData.uploadUrl || !signData.apiKey || !signData.signature || !signData.timestamp) {
        throw new Error(signData.error ?? 'Could not prepare upload.');
      }

      const uploadBody = new FormData();
      uploadBody.append('file', file);
      uploadBody.append('api_key', signData.apiKey);
      uploadBody.append('timestamp', String(signData.timestamp));
      uploadBody.append('signature', signData.signature);
      uploadBody.append('folder', signData.folder ?? 'zhua/products');
      uploadBody.append('public_id', signData.publicId ?? 'asset');

      const uploadRes = await fetch(signData.uploadUrl, {
        method: 'POST',
        body: uploadBody,
      });

      const uploadData = (await uploadRes.json()) as {
        secure_url?: string;
        public_id?: string;
        width?: number;
        height?: number;
        format?: string;
        bytes?: number;
        error?: { message?: string };
      };

      if (!uploadRes.ok || !uploadData.secure_url || !uploadData.public_id) {
        throw new Error(uploadData.error?.message ?? 'Cloudinary upload failed.');
      }

      const nextImages: CloudinaryImageAsset[] = [
        ...target.images,
        {
          publicId: uploadData.public_id,
          secureUrl: uploadData.secure_url,
          alt: target.name,
          width: uploadData.width,
          height: uploadData.height,
          format: uploadData.format,
          bytes: uploadData.bytes,
          createdAt: new Date().toISOString(),
        },
      ];

      await updateProduct(productId, { images: nextImages });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not upload image.';
      setError(message);
    } finally {
      setUploadingId(null);
    }
  };

  const removeFirstImage = async (product: AdminProductRow) => {
    if (product.images.length === 0) {
      return;
    }

    const [first, ...rest] = product.images;

    setSavingId(product.id);
    setError('');

    try {
      const deleteRes = await fetch('/api/admin/media/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: first.publicId }),
      });

      const deleteData = (await deleteRes.json()) as { error?: string };
      if (!deleteRes.ok) {
        throw new Error(deleteData.error ?? 'Could not delete image from Cloudinary.');
      }

      await updateProduct(product.id, { images: rest });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not remove image.';
      setError(message);
      setSavingId(null);
    }
  };

  const deleteProduct = async (id: string) => {
    setSavingId(id);
    setError('');

    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? 'Could not delete product.');
      }

      setProducts((prev) => prev.filter((product) => product.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not delete product.';
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  const createProduct = async () => {
    setError('');

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProduct.name,
          category: newProduct.category,
          price: Number(newProduct.price || 0),
          stock: Number(newProduct.stock || 0),
          description: newProduct.description,
          longDescription: newProduct.longDescription,
        }),
      });

      const data = (await res.json()) as { product?: AdminProductRow; error?: string };
      if (!res.ok || !data.product) {
        throw new Error(data.error ?? 'Could not create product.');
      }

      setProducts((prev) => [data.product!, ...prev]);
      setNewProduct({
        name: '',
        category: 'Furniture',
        price: '',
        stock: '',
        description: '',
        longDescription: '',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create product.';
      setError(message);
    }
  };

  return (
    <>
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Catalog Controls</h2>
        <div className={styles.formGrid}>
          <div className={styles.formRow}>
            <label className={styles.label}>Search Products</label>
            <input
              className={styles.input}
              placeholder="Type product name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Category</label>
            <select className={styles.select} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>All</option>
              <option>Furniture</option>
              <option>Curtains</option>
              <option>Accessories</option>
            </select>
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>New Product Name</label>
            <input
              className={styles.input}
              placeholder="New product name"
              value={newProduct.name}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>New Product Category</label>
            <select
              className={styles.select}
              value={newProduct.category}
              onChange={(e) =>
                setNewProduct((prev) => ({
                  ...prev,
                  category: e.target.value as 'Furniture' | 'Curtains' | 'Accessories',
                }))
              }
            >
              <option>Furniture</option>
              <option>Curtains</option>
              <option>Accessories</option>
            </select>
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>New Product Price (R)</label>
            <input
              className={styles.input}
              inputMode="numeric"
              value={newProduct.price}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, price: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>New Product Stock</label>
            <input
              className={styles.input}
              inputMode="numeric"
              value={newProduct.stock}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, stock: e.target.value }))}
            />
          </div>
          <div className={styles.formRow} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.label}>Short Description</label>
            <textarea
              className={styles.textarea}
              placeholder="A short summary shown near the product title"
              value={newProduct.description}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className={styles.formRow} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.label}>Long Description (Optional)</label>
            <textarea
              className={styles.textarea}
              placeholder="Detailed copy for the product detail page"
              value={newProduct.longDescription}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, longDescription: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Create</label>
            <button className={styles.ghostButton} type="button" onClick={createProduct}>
              Add Product
            </button>
          </div>
        </div>
        {error ? <p style={{ color: '#ffd0d0', marginTop: '0.75rem' }}>{error}</p> : null}
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Products ({filtered.length})</h2>
        {loading ? <p style={{ color: '#a9b7c9' }}>Loading products...</p> : null}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Category</th>
                <th>Media</th>
                <th>Stock</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id}>
                  <td>{product.sku}</td>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>
                    <div style={{ display: 'grid', gap: '0.42rem' }}>
                      {product.primaryImage ? (
                        <img
                          src={product.primaryImage}
                          alt={product.name}
                          style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      ) : (
                        <div style={{ width: 60, height: 40, borderRadius: 6, background: 'rgba(255,255,255,0.08)', border: '1px dashed rgba(255,255,255,0.2)' }} />
                      )}
                      <span style={{ color: '#a9b7c9', fontSize: '0.72rem' }}>{product.imageCount} image(s)</span>
                    </div>
                  </td>
                  <td>
                    <input
                      className={styles.input}
                      style={{ maxWidth: '88px' }}
                      inputMode="numeric"
                      value={String(product.stock)}
                      onChange={(e) => {
                        const stock = Number(e.target.value || 0);
                        setProducts((prev) =>
                          prev.map((row) =>
                            row.id === product.id
                              ? {
                                  ...row,
                                  stock: Number.isFinite(stock) ? stock : row.stock,
                                }
                              : row
                          )
                        );
                      }}
                    />
                  </td>
                  <td>
                    <input
                      className={styles.input}
                      style={{ maxWidth: '130px' }}
                      inputMode="numeric"
                      value={String(product.price)}
                      onChange={(e) => {
                        const price = Number(e.target.value || 0);
                        setProducts((prev) =>
                          prev.map((row) =>
                            row.id === product.id
                              ? {
                                  ...row,
                                  price: Number.isFinite(price) ? price : row.price,
                                }
                              : row
                          )
                        );
                      }}
                    />
                    <div style={{ color: '#a9b7c9', fontSize: '0.72rem', marginTop: '0.3rem' }}>
                      {formatCurrency(product.price)}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        product.status === 'Active'
                          ? styles.badgeSuccess
                          : product.status === 'Draft'
                            ? styles.badgeWarn
                            : styles.badgeDanger
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.inlineActions}>
                      <select
                        className={styles.select}
                        value={product.status}
                        onChange={(e) =>
                          setProducts((prev) =>
                            prev.map((row) =>
                              row.id === product.id
                                ? {
                                    ...row,
                                    status: e.target.value as 'Active' | 'Draft' | 'Archived',
                                  }
                                : row
                            )
                          )
                        }
                      >
                        <option>Active</option>
                        <option>Draft</option>
                        <option>Archived</option>
                      </select>
                      <button
                        className={styles.ghostButton}
                        disabled={savingId === product.id}
                        onClick={() => updateProduct(product.id, product)}
                      >
                        {savingId === product.id ? 'Saving...' : 'Save'}
                      </button>
                      <label className={styles.ghostButton} style={{ cursor: uploadingId === product.id ? 'wait' : 'pointer' }}>
                        {uploadingId === product.id ? 'Uploading...' : 'Upload'}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              void uploadProductImage(product.id, file);
                            }
                            e.currentTarget.value = '';
                          }}
                        />
                      </label>
                      <button
                        className={styles.ghostButton}
                        disabled={savingId === product.id || product.images.length === 0}
                        onClick={() => void removeFirstImage(product)}
                      >
                        Remove Img
                      </button>
                      <button
                        className={styles.ghostButton}
                        disabled={savingId === product.id}
                        onClick={() => deleteProduct(product.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
