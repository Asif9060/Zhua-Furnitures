'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/admin-data';
import { useToastFeedback } from '@/lib/toast-feedback';
import styles from '../admin-pages.module.css';

type AdminCategory = 'Furniture' | 'Curtains' | 'Accessories';
type AdminStatus = 'Active' | 'Draft' | 'Archived';
type AdminBadge = 'new' | 'sale' | 'custom' | 'bestseller' | null;

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
  category: AdminCategory;
  subcategory: string;
  stock: number;
  price: number;
  offerPrice: number;
  originalPrice: number | null;
  offerPercentage: number;
  badge: AdminBadge;
  description: string;
  longDescription: string;
  deliveryDays: string;
  weightKg: number;
  widthCm: number;
  depthCm: number;
  heightCm: number;
  status: AdminStatus;
  images: CloudinaryImageAsset[];
  primaryImage: string | null;
  imageCount: number;
}

type ProductPatchPayload = {
  sku: string;
  slug: string;
  name: string;
  category: AdminCategory;
  subcategory: string;
  status: AdminStatus;
  badge: AdminBadge;
  price: string;
  offerPercentage: string;
  stock: string;
  description: string;
  longDescription: string;
  deliveryDays: string;
  weightKg: string;
  widthCm: string;
  depthCm: string;
  heightCm: string;
};

const defaultNewProduct: ProductPatchPayload = {
  sku: '',
  slug: '',
  name: '',
  category: 'Furniture',
  subcategory: 'General',
  status: 'Active',
  badge: null,
  price: '',
  offerPercentage: '',
  stock: '',
  description: '',
  longDescription: '',
  deliveryDays: '7-10 business days',
  weightKg: '',
  widthCm: '',
  depthCm: '',
  heightCm: '',
};

function toSafeMeasure(value: unknown): number {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.round(parsed * 100) / 100);
}

function clampOfferPercentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value * 100) / 100));
}

function calculateOfferPrice(basePrice: number, offerPercentage: number): number {
  const safeBasePrice = Number.isFinite(basePrice) ? Math.max(0, basePrice) : 0;
  const safeOfferPercentage = clampOfferPercentage(offerPercentage);

  return Math.max(0, Math.round(safeBasePrice * ((100 - safeOfferPercentage) / 100)));
}

function normalizeProductRow(row: AdminProductRow): AdminProductRow {
  const safeBasePrice = Number.isFinite(row.price) ? Math.max(0, row.price) : 0;
  const safeOfferPercentage = clampOfferPercentage(Number(row.offerPercentage ?? 0));
  const nextOfferPrice =
    Number.isFinite(row.offerPrice) && row.offerPrice >= 0
      ? Math.round(row.offerPrice)
      : calculateOfferPrice(safeBasePrice, safeOfferPercentage);

  const nextBadge =
    safeOfferPercentage > 0
      ? row.badge ?? 'sale'
      : row.badge === 'sale'
        ? null
        : row.badge;

  return {
    ...row,
    sku: row.sku ?? '',
    slug: row.slug ?? '',
    subcategory: row.subcategory?.trim() || 'General',
    price: Math.round(safeBasePrice),
    offerPrice: nextOfferPrice,
    originalPrice: safeOfferPercentage > 0 ? Math.round(safeBasePrice) : null,
    offerPercentage: safeOfferPercentage,
    badge: nextBadge,
    description: row.description ?? '',
    longDescription: row.longDescription ?? '',
    deliveryDays: row.deliveryDays?.trim() || '7-10 business days',
    weightKg: toSafeMeasure(row.weightKg),
    widthCm: toSafeMeasure(row.widthCm),
    depthCm: toSafeMeasure(row.depthCm),
    heightCm: toSafeMeasure(row.heightCm),
    images: Array.isArray(row.images) ? row.images : [],
    primaryImage: row.primaryImage ?? null,
    imageCount: Number.isFinite(row.imageCount) ? row.imageCount : row.images?.length ?? 0,
  };
}

function buildSavePayload(product: AdminProductRow) {
  return {
    sku: product.sku.trim(),
    slug: product.slug.trim(),
    name: product.name.trim(),
    category: product.category,
    subcategory: product.subcategory.trim() || 'General',
    status: product.status,
    badge: product.badge,
    price: Math.max(0, Math.round(product.price)),
    offerPercentage: clampOfferPercentage(product.offerPercentage),
    stock: Math.max(0, Math.round(product.stock)),
    description: product.description.trim(),
    longDescription: product.longDescription.trim(),
    deliveryDays: product.deliveryDays.trim() || '7-10 business days',
    weightKg: toSafeMeasure(product.weightKg),
    widthCm: toSafeMeasure(product.widthCm),
    depthCm: toSafeMeasure(product.depthCm),
    heightCm: toSafeMeasure(product.heightCm),
    images: product.images,
  };
}

export default function ProductsAdminPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<AdminProductRow | null>(null);
  const [newProduct, setNewProduct] = useState<ProductPatchPayload>(defaultNewProduct);

  useToastFeedback({ error });

  const loadProducts = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/products', { cache: 'no-store' });
      const data = (await res.json()) as { products?: AdminProductRow[]; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? 'Could not load products.');
      }

      setProducts((data.products ?? []).map((row) => normalizeProductRow(row)));
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

  useEffect(() => {
    if (!editingProductId) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && savingId !== editingProductId) {
        setEditingProductId(null);
        setEditDraft(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editingProductId, savingId]);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === 'All' || product.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [products, query, category]);

  const setLocalProduct = (
    id: string,
    updater: (current: AdminProductRow) => AdminProductRow
  ) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id ? normalizeProductRow(updater(product)) : product
      )
    );
  };

  const applyOfferToProduct = (
    product: AdminProductRow,
    nextBasePrice: number,
    nextOfferPercentage: number
  ): AdminProductRow => {
    const safeBasePrice = Number.isFinite(nextBasePrice) ? Math.max(0, Math.round(nextBasePrice)) : product.price;
    const safeOfferPercentage = clampOfferPercentage(nextOfferPercentage);
    const nextOfferPrice = calculateOfferPrice(safeBasePrice, safeOfferPercentage);
    const nextBadge =
      safeOfferPercentage > 0
        ? product.badge ?? 'sale'
        : product.badge === 'sale'
          ? null
          : product.badge;

    return {
      ...product,
      price: safeBasePrice,
      offerPercentage: safeOfferPercentage,
      offerPrice: nextOfferPrice,
      originalPrice: safeOfferPercentage > 0 ? safeBasePrice : null,
      badge: nextBadge,
    };
  };

  const updateProduct = async (
    id: string,
    partial: Record<string, unknown>,
    successMessage = 'Product updated successfully.'
  ): Promise<boolean> => {
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

      setProducts((prev) =>
        prev.map((product) =>
          product.id === id ? normalizeProductRow(data.product!) : product
        )
      );
      if (successMessage) {
        toast.success(successMessage);
      }
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update product.';
      setError(message);
      return false;
    } finally {
      setSavingId(null);
    }
  };

  const openEditModal = (product: AdminProductRow) => {
    setError('');
    setEditingProductId(product.id);
    setEditDraft(
      normalizeProductRow({
        ...product,
        images: product.images.map((image) => ({ ...image })),
      })
    );
  };

  const closeEditModal = () => {
    if (editingProductId && savingId === editingProductId) {
      return;
    }

    setEditingProductId(null);
    setEditDraft(null);
  };

  const saveEditModal = async () => {
    if (!editingProductId || !editDraft) {
      return;
    }

    const didSave = await updateProduct(
      editingProductId,
      buildSavePayload(editDraft),
      'Product changes saved successfully.'
    );
    if (!didSave) {
      return;
    }

    setEditingProductId(null);
    setEditDraft(null);
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

      await updateProduct(productId, { images: nextImages }, 'Product image uploaded successfully.');
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

      await updateProduct(product.id, { images: rest }, 'Product image removed successfully.');
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
      toast.success('Product deleted successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not delete product.';
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  const createProduct = async () => {
    setError('');

    if (!newProduct.name.trim()) {
      setError('Product name is required.');
      return;
    }

    const basePrice = Number(newProduct.price || 0);
    const offerPercentage = clampOfferPercentage(Number(newProduct.offerPercentage || 0));
    const badge = newProduct.badge ?? (offerPercentage > 0 ? 'sale' : null);

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProduct.name,
          slug: newProduct.slug,
          sku: newProduct.sku,
          category: newProduct.category,
          subcategory: newProduct.subcategory,
          status: newProduct.status,
          badge,
          price: Number.isFinite(basePrice) ? Math.max(0, basePrice) : 0,
          offerPercentage,
          stock: Number(newProduct.stock || 0),
          deliveryDays: newProduct.deliveryDays,
          weightKg: Number(newProduct.weightKg || 0),
          widthCm: Number(newProduct.widthCm || 0),
          depthCm: Number(newProduct.depthCm || 0),
          heightCm: Number(newProduct.heightCm || 0),
          description: newProduct.description,
          longDescription: newProduct.longDescription,
        }),
      });

      const data = (await res.json()) as { product?: AdminProductRow; error?: string };
      if (!res.ok || !data.product) {
        throw new Error(data.error ?? 'Could not create product.');
      }

      setProducts((prev) => [normalizeProductRow(data.product!), ...prev]);
      setNewProduct(defaultNewProduct);
      toast.success('Product created successfully.');
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
            <label className={styles.label}>New Product Slug (Optional)</label>
            <input
              className={styles.input}
              placeholder="auto-generated-when-empty"
              value={newProduct.slug}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, slug: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>New Product SKU (Optional)</label>
            <input
              className={styles.input}
              placeholder="ZH-XXXX-000"
              value={newProduct.sku}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, sku: e.target.value }))}
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
            <label className={styles.label}>Subcategory</label>
            <input
              className={styles.input}
              placeholder="General"
              value={newProduct.subcategory}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, subcategory: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Original Price (R)</label>
            <input
              className={styles.input}
              inputMode="numeric"
              value={newProduct.price}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, price: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Offer Percentage (%)</label>
            <input
              className={styles.input}
              inputMode="decimal"
              placeholder="0"
              value={newProduct.offerPercentage}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, offerPercentage: e.target.value }))}
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
          <div className={styles.formRow}>
            <label className={styles.label}>Status</label>
            <select
              className={styles.select}
              value={newProduct.status}
              onChange={(e) =>
                setNewProduct((prev) => ({
                  ...prev,
                  status: e.target.value as AdminStatus,
                }))
              }
            >
              <option>Active</option>
              <option>Draft</option>
              <option>Archived</option>
            </select>
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Badge</label>
            <select
              className={styles.select}
              value={newProduct.badge ?? ''}
              onChange={(e) =>
                setNewProduct((prev) => ({
                  ...prev,
                  badge: e.target.value ? (e.target.value as Exclude<AdminBadge, null>) : null,
                }))
              }
            >
              <option value="">None</option>
              <option value="new">new</option>
              <option value="sale">sale</option>
              <option value="custom">custom</option>
              <option value="bestseller">bestseller</option>
            </select>
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Delivery Days</label>
            <input
              className={styles.input}
              placeholder="7-10 business days"
              value={newProduct.deliveryDays}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, deliveryDays: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Weight (kg)</label>
            <input
              className={styles.input}
              inputMode="decimal"
              placeholder="0"
              value={newProduct.weightKg}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, weightKg: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Width (cm)</label>
            <input
              className={styles.input}
              inputMode="decimal"
              placeholder="0"
              value={newProduct.widthCm}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, widthCm: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Depth (cm)</label>
            <input
              className={styles.input}
              inputMode="decimal"
              placeholder="0"
              value={newProduct.depthCm}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, depthCm: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Height (cm)</label>
            <input
              className={styles.input}
              inputMode="decimal"
              placeholder="0"
              value={newProduct.heightCm}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, heightCm: e.target.value }))}
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
        <div className={`${styles.tableWrap} ${styles.productTableWrap}`}>
          <table className={`${styles.table} ${styles.productTable}`}>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Category</th>
                <th>Media</th>
                <th>Stock</th>
                <th>Specs</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id}>
                  <td data-label="SKU">
                    <input
                      className={styles.input}
                      readOnly
                      value={product.sku}
                      onChange={(e) =>
                        setLocalProduct(product.id, (current) => ({
                          ...current,
                          sku: e.target.value,
                        }))
                      }
                    />
                  </td>
                  <td data-label="Name">
                    <div style={{ display: 'grid', gap: '0.4rem', minWidth: '220px' }}>
                      <input
                        className={styles.input}
                        readOnly
                        value={product.name}
                        onChange={(e) =>
                          setLocalProduct(product.id, (current) => ({
                            ...current,
                            name: e.target.value,
                          }))
                        }
                      />
                      <input
                        className={styles.input}
                        readOnly
                        value={product.slug}
                        onChange={(e) =>
                          setLocalProduct(product.id, (current) => ({
                            ...current,
                            slug: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </td>
                  <td data-label="Category">
                    <div style={{ display: 'grid', gap: '0.4rem', minWidth: '180px' }}>
                      <select
                        className={styles.select}
                        disabled
                        value={product.category}
                        onChange={(e) =>
                          setLocalProduct(product.id, (current) => ({
                            ...current,
                            category: e.target.value as AdminCategory,
                          }))
                        }
                      >
                        <option>Furniture</option>
                        <option>Curtains</option>
                        <option>Accessories</option>
                      </select>
                      <input
                        className={styles.input}
                        readOnly
                        value={product.subcategory}
                        onChange={(e) =>
                          setLocalProduct(product.id, (current) => ({
                            ...current,
                            subcategory: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </td>
                  <td data-label="Media">
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
                  <td data-label="Stock">
                    <input
                      className={styles.input}
                      style={{ maxWidth: '88px' }}
                      readOnly
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
                  <td data-label="Specs">
                    <div style={{ display: 'grid', gap: '0.4rem', minWidth: '170px' }}>
                      <input
                        className={styles.input}
                        readOnly
                        inputMode="decimal"
                        placeholder="Weight kg"
                        value={String(product.weightKg)}
                        onChange={(e) => {
                          const next = toSafeMeasure(e.target.value);
                          setLocalProduct(product.id, (current) => ({
                            ...current,
                            weightKg: next,
                          }));
                        }}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.35rem' }}>
                        <input
                          className={styles.input}
                          readOnly
                          inputMode="decimal"
                          placeholder="W"
                          value={String(product.widthCm)}
                          onChange={(e) => {
                            const next = toSafeMeasure(e.target.value);
                            setLocalProduct(product.id, (current) => ({
                              ...current,
                              widthCm: next,
                            }));
                          }}
                        />
                        <input
                          className={styles.input}
                          readOnly
                          inputMode="decimal"
                          placeholder="D"
                          value={String(product.depthCm)}
                          onChange={(e) => {
                            const next = toSafeMeasure(e.target.value);
                            setLocalProduct(product.id, (current) => ({
                              ...current,
                              depthCm: next,
                            }));
                          }}
                        />
                        <input
                          className={styles.input}
                          readOnly
                          inputMode="decimal"
                          placeholder="H"
                          value={String(product.heightCm)}
                          onChange={(e) => {
                            const next = toSafeMeasure(e.target.value);
                            setLocalProduct(product.id, (current) => ({
                              ...current,
                              heightCm: next,
                            }));
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td data-label="Price">
                    <div style={{ display: 'grid', gap: '0.45rem', minWidth: '180px' }}>
                      <input
                        className={styles.input}
                        readOnly
                        inputMode="numeric"
                        value={String(product.price)}
                        onChange={(e) => {
                          const nextPrice = Number(e.target.value || 0);
                          setLocalProduct(product.id, (current) =>
                            applyOfferToProduct(
                              current,
                              Number.isFinite(nextPrice) ? nextPrice : current.price,
                              current.offerPercentage
                            )
                          );
                        }}
                      />
                      <input
                        className={styles.input}
                        readOnly
                        inputMode="decimal"
                        placeholder="Offer %"
                        value={String(product.offerPercentage)}
                        onChange={(e) => {
                          const nextOffer = Number(e.target.value || 0);
                          setLocalProduct(product.id, (current) =>
                            applyOfferToProduct(
                              current,
                              current.price,
                              Number.isFinite(nextOffer) ? nextOffer : current.offerPercentage
                            )
                          );
                        }}
                      />
                    </div>
                    <div style={{ color: '#a9b7c9', fontSize: '0.72rem', marginTop: '0.3rem', display: 'grid', gap: '0.2rem' }}>
                      <span>Original: {formatCurrency(product.price)}</span>
                      <span>Offer Price: {formatCurrency(product.offerPrice)}</span>
                    </div>
                  </td>
                  <td data-label="Status">
                    <div style={{ display: 'grid', gap: '0.4rem', minWidth: '145px' }}>
                      <select
                        className={styles.select}
                        disabled
                        value={product.status}
                        onChange={(e) =>
                          setLocalProduct(product.id, (current) => ({
                            ...current,
                            status: e.target.value as AdminStatus,
                          }))
                        }
                      >
                        <option>Active</option>
                        <option>Draft</option>
                        <option>Archived</option>
                      </select>
                      <select
                        className={styles.select}
                        disabled
                        value={product.badge ?? ''}
                        onChange={(e) =>
                          setLocalProduct(product.id, (current) => ({
                            ...current,
                            badge: e.target.value ? (e.target.value as Exclude<AdminBadge, null>) : null,
                          }))
                        }
                      >
                        <option value="">No Badge</option>
                        <option value="new">new</option>
                        <option value="sale">sale</option>
                        <option value="custom">custom</option>
                        <option value="bestseller">bestseller</option>
                      </select>
                    </div>
                  </td>
                  <td data-label="Actions">
                    <div className={styles.inlineActions}>
                      <button
                        className={styles.ghostButton}
                        disabled={
                          savingId === product.id ||
                          uploadingId === product.id ||
                          (editingProductId !== null && editingProductId !== product.id)
                        }
                        onClick={() => openEditModal(product)}
                      >
                        {editingProductId === product.id ? 'Editing...' : 'Edit'}
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

      {editingProductId && editDraft ? (
        <div className={styles.modalOverlay} onClick={closeEditModal}>
          <div
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-product-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <h3 id="edit-product-title" className={styles.modalTitle}>Edit Product</h3>
                <p className={styles.modalMeta}>ID: {editingProductId}</p>
              </div>
              <button className={styles.ghostButton} onClick={closeEditModal} disabled={savingId === editingProductId}>
                Close
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.formRow}>
                  <label className={styles.label}>SKU</label>
                  <input
                    className={styles.input}
                    value={editDraft.sku}
                    onChange={(e) =>
                      setEditDraft((prev) => (prev ? { ...prev, sku: e.target.value } : prev))
                    }
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Name</label>
                  <input
                    className={styles.input}
                    value={editDraft.name}
                    onChange={(e) =>
                      setEditDraft((prev) => (prev ? { ...prev, name: e.target.value } : prev))
                    }
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Slug</label>
                  <input
                    className={styles.input}
                    value={editDraft.slug}
                    onChange={(e) =>
                      setEditDraft((prev) => (prev ? { ...prev, slug: e.target.value } : prev))
                    }
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Category</label>
                  <select
                    className={styles.select}
                    value={editDraft.category}
                    onChange={(e) =>
                      setEditDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              category: e.target.value as AdminCategory,
                            }
                          : prev
                      )
                    }
                  >
                    <option>Furniture</option>
                    <option>Curtains</option>
                    <option>Accessories</option>
                  </select>
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Subcategory</label>
                  <input
                    className={styles.input}
                    value={editDraft.subcategory}
                    onChange={(e) =>
                      setEditDraft((prev) => (prev ? { ...prev, subcategory: e.target.value } : prev))
                    }
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Status</label>
                  <select
                    className={styles.select}
                    value={editDraft.status}
                    onChange={(e) =>
                      setEditDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              status: e.target.value as AdminStatus,
                            }
                          : prev
                      )
                    }
                  >
                    <option>Active</option>
                    <option>Draft</option>
                    <option>Archived</option>
                  </select>
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Badge</label>
                  <select
                    className={styles.select}
                    value={editDraft.badge ?? ''}
                    onChange={(e) =>
                      setEditDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              badge: e.target.value ? (e.target.value as Exclude<AdminBadge, null>) : null,
                            }
                          : prev
                      )
                    }
                  >
                    <option value="">No Badge</option>
                    <option value="new">new</option>
                    <option value="sale">sale</option>
                    <option value="custom">custom</option>
                    <option value="bestseller">bestseller</option>
                  </select>
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Stock</label>
                  <input
                    className={styles.input}
                    inputMode="numeric"
                    value={String(editDraft.stock)}
                    onChange={(e) => {
                      const nextStock = Number(e.target.value || 0);
                      setEditDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              stock: Number.isFinite(nextStock) ? nextStock : prev.stock,
                            }
                          : prev
                      );
                    }}
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Price (R)</label>
                  <input
                    className={styles.input}
                    inputMode="numeric"
                    value={String(editDraft.price)}
                    onChange={(e) => {
                      const nextPrice = Number(e.target.value || 0);
                      setEditDraft((prev) =>
                        prev
                          ? applyOfferToProduct(
                              prev,
                              Number.isFinite(nextPrice) ? nextPrice : prev.price,
                              prev.offerPercentage
                            )
                          : prev
                      );
                    }}
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Offer Percentage (%)</label>
                  <input
                    className={styles.input}
                    inputMode="decimal"
                    value={String(editDraft.offerPercentage)}
                    onChange={(e) => {
                      const nextOffer = Number(e.target.value || 0);
                      setEditDraft((prev) =>
                        prev
                          ? applyOfferToProduct(
                              prev,
                              prev.price,
                              Number.isFinite(nextOffer) ? nextOffer : prev.offerPercentage
                            )
                          : prev
                      );
                    }}
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Delivery Days</label>
                  <input
                    className={styles.input}
                    value={editDraft.deliveryDays}
                    onChange={(e) =>
                      setEditDraft((prev) => (prev ? { ...prev, deliveryDays: e.target.value } : prev))
                    }
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Weight (kg)</label>
                  <input
                    className={styles.input}
                    inputMode="decimal"
                    value={String(editDraft.weightKg)}
                    onChange={(e) =>
                      setEditDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              weightKg: toSafeMeasure(e.target.value),
                            }
                          : prev
                      )
                    }
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Width (cm)</label>
                  <input
                    className={styles.input}
                    inputMode="decimal"
                    value={String(editDraft.widthCm)}
                    onChange={(e) =>
                      setEditDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              widthCm: toSafeMeasure(e.target.value),
                            }
                          : prev
                      )
                    }
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Depth (cm)</label>
                  <input
                    className={styles.input}
                    inputMode="decimal"
                    value={String(editDraft.depthCm)}
                    onChange={(e) =>
                      setEditDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              depthCm: toSafeMeasure(e.target.value),
                            }
                          : prev
                      )
                    }
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Height (cm)</label>
                  <input
                    className={styles.input}
                    inputMode="decimal"
                    value={String(editDraft.heightCm)}
                    onChange={(e) =>
                      setEditDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              heightCm: toSafeMeasure(e.target.value),
                            }
                          : prev
                      )
                    }
                  />
                </div>

                <div className={styles.formRow} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.label}>Short Description</label>
                  <textarea
                    className={styles.textarea}
                    value={editDraft.description}
                    onChange={(e) =>
                      setEditDraft((prev) => (prev ? { ...prev, description: e.target.value } : prev))
                    }
                  />
                </div>

                <div className={styles.formRow} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.label}>Long Description</label>
                  <textarea
                    className={styles.textarea}
                    value={editDraft.longDescription}
                    onChange={(e) =>
                      setEditDraft((prev) => (prev ? { ...prev, longDescription: e.target.value } : prev))
                    }
                  />
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.ghostButton} onClick={closeEditModal} disabled={savingId === editingProductId}>
                Cancel
              </button>
              <button className={styles.ghostButton} onClick={saveEditModal} disabled={savingId === editingProductId}>
                {savingId === editingProductId ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
