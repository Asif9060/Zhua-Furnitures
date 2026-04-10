'use client';

import { useEffect, useState } from 'react';
import styles from '../admin-pages.module.css';

type CustomerSegment = 'VIP' | 'Repeat' | 'New';

type AdminCustomer = {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  orders: number;
  segment: CustomerSegment;
  lastOrder: string;
};

const currencyFormatter = new Intl.NumberFormat('en-ZA');

function formatCurrency(value: number): string {
  return `R ${currencyFormatter.format(value)}`;
}

function segmentClass(segment: string): string {
  if (segment === 'VIP') return `${styles.badge} ${styles.badgeSuccess}`;
  if (segment === 'Repeat') return `${styles.badge} ${styles.badgeInfo}`;
  return `${styles.badge} ${styles.badgeWarn}`;
}

export default function CustomersAdminPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadCustomers = async () => {
      try {
        const response = await fetch('/api/admin/customers', {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          const fallbackMessage = `Failed to load customers (${response.status}).`;
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error || fallbackMessage);
        }

        const payload = (await response.json()) as { customers?: AdminCustomer[] };
        setCustomers(Array.isArray(payload.customers) ? payload.customers : []);
        setError(null);
      } catch (caughtError) {
        if (controller.signal.aborted) {
          return;
        }

        const message =
          caughtError instanceof Error ? caughtError.message : 'Unable to load customers right now.';
        setError(message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadCustomers();

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <section className={styles.card}>
      <h2 className={styles.sectionTitle}>Customer Insights {loading ? '' : `(${customers.length})`}</h2>
      {error ? <p style={{ color: '#f88f8f', marginBottom: '0.7rem' }}>{error}</p> : null}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Email</th>
              <th>Segment</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Last Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>Loading customers...</td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={7}>No customers found yet.</td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td><span className={segmentClass(customer.segment)}>{customer.segment}</span></td>
                  <td>{customer.orders}</td>
                  <td>{formatCurrency(customer.totalSpent)}</td>
                  <td>{customer.lastOrder}</td>
                  <td>
                    <div className={styles.inlineActions}>
                      <button className={styles.ghostButton}>Profile</button>
                      <button className={styles.ghostButton}>Message</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
