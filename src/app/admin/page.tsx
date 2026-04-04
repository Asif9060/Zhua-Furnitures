import {
  adminAlerts,
  adminMetrics,
  adminOrders,
  formatCurrency,
  revenueByWeek,
} from '@/lib/admin-data';
import styles from './admin-pages.module.css';

function statusClass(status: string): string {
  if (status === 'Delivered') return `${styles.badge} ${styles.badgeSuccess}`;
  if (status === 'Shipped' || status === 'Processing') return `${styles.badge} ${styles.badgeInfo}`;
  if (status === 'Pending') return `${styles.badge} ${styles.badgeWarn}`;
  return `${styles.badge} ${styles.badgeDanger}`;
}

export default function AdminDashboardPage() {
  return (
    <>
      <section className={styles.grid4}>
        {adminMetrics.map((metric) => (
          <article key={metric.label} className={styles.card}>
            <p className={styles.cardTitle}>{metric.label}</p>
            <p className={styles.kpiValue}>{metric.value}</p>
            <p className={styles.kpiMeta}>
              <span className={metric.trend === 'up' ? styles.kpiUp : styles.kpiDown}>{metric.change}</span> {metric.note}
            </p>
          </article>
        ))}
      </section>

      <section className={styles.grid2}>
        <article className={styles.card}>
          <h2 className={styles.sectionTitle}>Revenue Trend</h2>
          <div className={styles.chart}>
            {revenueByWeek.map((point) => (
              <div key={point.week} className={styles.chartCol}>
                <div className={styles.chartBar} style={{ height: `${point.value}%` }} />
                <span className={styles.chartLabel}>{point.week}</span>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.card}>
          <h2 className={styles.sectionTitle}>Operational Alerts</h2>
          <div className={styles.alertList}>
            {adminAlerts.map((alert) => (
              <div key={alert} className={styles.alertItem}>
                {alert}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Latest Orders</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {adminOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer}</td>
                  <td>{order.date}</td>
                  <td>{order.items}</td>
                  <td>{formatCurrency(order.total)}</td>
                  <td>
                    <span className={statusClass(order.status)}>{order.status}</span>
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
