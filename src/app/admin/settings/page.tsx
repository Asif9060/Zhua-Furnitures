import styles from '../admin-pages.module.css';

export default function SettingsAdminPage() {
  return (
    <>
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Store Preferences</h2>
        <div className={styles.formGrid}>
          <div className={styles.formRow}>
            <label className={styles.label}>Store Name</label>
            <input className={styles.input} defaultValue="Zhua Enterprises" />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Support Email</label>
            <input className={styles.input} defaultValue="hello@zhuaenterprises.co.za" />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Default Currency</label>
            <select className={styles.select} defaultValue="ZAR">
              <option value="ZAR">ZAR (R)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Order Prefix</label>
            <input className={styles.input} defaultValue="ZE-2026" />
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Automation Toggles</h2>
        <div style={{ display: 'grid', gap: '0.6rem' }}>
          <div className={styles.switchRow}>
            <div className={styles.switchCopy}>
              <p className={styles.switchTitle}>Auto-confirm payments</p>
              <p className={styles.switchDesc}>Mark paid orders as confirmed after gateway success.</p>
            </div>
            <span className={styles.toggle} />
          </div>

          <div className={styles.switchRow}>
            <div className={styles.switchCopy}>
              <p className={styles.switchTitle}>Low-stock alerts</p>
              <p className={styles.switchDesc}>Send internal alerts when stock falls below threshold.</p>
            </div>
            <span className={styles.toggle} />
          </div>

          <div className={styles.switchRow}>
            <div className={styles.switchCopy}>
              <p className={styles.switchTitle}>Review moderation queue</p>
              <p className={styles.switchDesc}>Hold new reviews for manual approval before publishing.</p>
            </div>
            <span className={styles.toggle} />
          </div>
        </div>
      </section>
    </>
  );
}
