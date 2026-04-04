import { adminCustomers, formatCurrency } from '@/lib/admin-data';
import styles from '../admin-pages.module.css';

function segmentClass(segment: string): string {
  if (segment === 'VIP') return `${styles.badge} ${styles.badgeSuccess}`;
  if (segment === 'Repeat') return `${styles.badge} ${styles.badgeInfo}`;
  return `${styles.badge} ${styles.badgeWarn}`;
}

export default function CustomersAdminPage() {
  return (
    <section className={styles.card}>
      <h2 className={styles.sectionTitle}>Customer Insights</h2>
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
            {adminCustomers.map((customer) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
