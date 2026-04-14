"use client";

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/admin-data';
import { useToastFeedback } from '@/lib/toast-feedback';
import styles from '../admin-pages.module.css';

function statusClass(status: string): string {
  if (status === 'Delivered') return `${styles.badge} ${styles.badgeSuccess}`;
  if (status === 'Shipped' || status === 'Processing') return `${styles.badge} ${styles.badgeInfo}`;
  if (status === 'Pending') return `${styles.badge} ${styles.badgeWarn}`;
  return `${styles.badge} ${styles.badgeDanger}`;
}

function paymentClass(status: string): string {
  if (status === 'Paid') return `${styles.badge} ${styles.badgeSuccess}`;
  if (status === 'Awaiting Payment' || status === 'Pending') return `${styles.badge} ${styles.badgeWarn}`;
  if (status === 'Partial') return `${styles.badge} ${styles.badgeWarn}`;
  return `${styles.badge} ${styles.badgeDanger}`;
}

interface AdminOrderRow {
  id: string;
  orderNumber: string;
  customer: string;
  customerEmail: string;
  date: string;
  total: number;
  items: number;
  orderItems: Array<{
    productName: string;
    quantity: number;
    lineTotal: number;
    selectedColor: string | null;
    selectedSize: string | null;
    selectedFabric: string | null;
  }>;
  payment: 'Awaiting Payment' | 'Pending' | 'Paid' | 'Partial' | 'Failed' | 'Placeholder';
  fulfillment: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
}

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  useToastFeedback({ error });

  const loadOrders = useCallback(async (orderNumberQuery: string) => {
    setLoading(true);
    setError('');

    try {
      const search = orderNumberQuery.trim();
      const endpoint = search
        ? `/api/admin/orders?q=${encodeURIComponent(search)}`
        : '/api/admin/orders';

      const res = await fetch(endpoint, { cache: 'no-store' });
      const data = (await res.json()) as { orders?: AdminOrderRow[]; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? 'Could not load orders.');
      }

      setOrders(data.orders ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load orders.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounceId = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);

    return () => clearTimeout(debounceId);
  }, [searchInput]);

  useEffect(() => {
    void loadOrders(searchQuery);
  }, [loadOrders, searchQuery]);

  const updateOrder = async (order: AdminOrderRow) => {
    setSavingId(order.id);
    setError('');

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fulfillment: order.fulfillment,
          payment: order.payment,
        }),
      });

      const data = (await res.json()) as { order?: AdminOrderRow; error?: string };
      if (!res.ok || !data.order) {
        throw new Error(data.error ?? 'Could not update order.');
      }

      setOrders((prev) => prev.map((row) => (row.id === order.id ? data.order! : row)));
      toast.success('Order updated successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update order.';
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className={styles.card}>
      <h2 className={styles.sectionTitle}>Order Queue</h2>
      <div className={styles.formRow} style={{ marginBottom: '0.8rem', maxWidth: '440px' }}>
        <label className={styles.label}>Search Order ID</label>
        <input
          className={styles.input}
          placeholder="Search exact Order ID: ZE-2026-112142"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
      {loading ? <p style={{ color: '#a9b7c9' }}>Loading orders...</p> : null}
      {error ? <p style={{ color: '#ffd0d0' }}>{error}</p> : null}
      {!loading && !error && orders.length === 0 && searchQuery ? (
        <p style={{ color: '#a9b7c9', marginBottom: '0.75rem' }}>
          No orders found for {searchQuery}.
        </p>
      ) : null}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Email</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Fulfillment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.orderNumber}</td>
                <td>{order.customer}</td>
                <td>{order.customerEmail}</td>
                <td>{order.date}</td>
                <td>
                  <p className={styles.orderItemsCount}>{order.items}</p>
                  {searchQuery ? (
                    <div className={styles.orderItemsDetailList}>
                      {(order.orderItems ?? []).map((item, index) => (
                        <article
                          className={styles.orderItemDetail}
                          key={`${order.id}-${item.productName}-${index}`}
                        >
                          <p className={styles.orderItemName}>{item.productName}</p>
                          <p className={styles.orderItemMeta}>
                            Qty: {item.quantity} · Line Total: {formatCurrency(item.lineTotal)}
                          </p>
                          {item.selectedColor ? (
                            <p className={styles.orderItemMeta}>Color: {item.selectedColor}</p>
                          ) : null}
                          {item.selectedSize ? (
                            <p className={styles.orderItemMeta}>Size: {item.selectedSize}</p>
                          ) : null}
                          {item.selectedFabric ? (
                            <p className={styles.orderItemMeta}>Fabric: {item.selectedFabric}</p>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  ) : null}
                </td>
                <td>{formatCurrency(order.total)}</td>
                <td>
                  <select
                    className={styles.select}
                    value={order.payment}
                    onChange={(e) =>
                      setOrders((prev) =>
                        prev.map((row) =>
                          row.id === order.id
                            ? {
                                ...row,
                                payment: e.target.value as AdminOrderRow['payment'],
                              }
                            : row
                        )
                      )
                    }
                  >
                    <option>Awaiting Payment</option>
                    <option>Pending</option>
                    <option>Paid</option>
                    <option>Partial</option>
                    <option>Failed</option>
                    <option>Placeholder</option>
                  </select>
                  <div style={{ marginTop: '0.4rem' }}>
                    <span className={paymentClass(order.payment)}>{order.payment}</span>
                  </div>
                </td>
                <td>
                  <select
                    className={styles.select}
                    value={order.fulfillment}
                    onChange={(e) =>
                      setOrders((prev) =>
                        prev.map((row) =>
                          row.id === order.id
                            ? {
                                ...row,
                                fulfillment: e.target.value as AdminOrderRow['fulfillment'],
                              }
                            : row
                        )
                      )
                    }
                  >
                    <option>Pending</option>
                    <option>Processing</option>
                    <option>Shipped</option>
                    <option>Delivered</option>
                    <option>Cancelled</option>
                  </select>
                  <div style={{ marginTop: '0.4rem' }}>
                    <span className={statusClass(order.fulfillment)}>{order.fulfillment}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.inlineActions}>
                    <button
                      className={styles.ghostButton}
                      disabled={savingId === order.id}
                      onClick={() => updateOrder(order)}
                    >
                      {savingId === order.id ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
