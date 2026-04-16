'use client';

import { useMemo, useState } from 'react';
import styles from '@/app/admin/admin-pages.module.css';

type AdminTransactionExportControlsProps = {
  initialMonth: number;
  initialYear: number;
  yearOptions: number[];
};

const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export default function AdminTransactionExportControls({
  initialMonth,
  initialYear,
  yearOptions,
}: AdminTransactionExportControlsProps) {
  const [month, setMonth] = useState(String(initialMonth));
  const [year, setYear] = useState(String(initialYear));
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fallbackFileName = useMemo(() => {
    return `transactions-${year}-${month.padStart(2, '0')}.csv`;
  }, [month, year]);

  async function handleDownload() {
    setIsDownloading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ month, year });
      const response = await fetch(`/api/admin/transactions/export?${params.toString()}`);

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Unable to download transaction export.');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition') ?? '';
      const nameMatch = /filename="([^"]+)"/i.exec(contentDisposition);
      const fileName = nameMatch?.[1] ?? fallbackFileName;

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      const message = downloadError instanceof Error ? downloadError.message : 'Download failed.';
      setError(message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <section className={styles.card}>
      <div className={styles.exportHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Transaction Export</h2>
          <p className={styles.exportHint}>Download full transaction details from the database in CSV format.</p>
        </div>
      </div>

      <div className={styles.exportControls}>
        <div className={styles.formRow}>
          <label className={styles.label} htmlFor="transaction-export-month">
            Month
          </label>
          <select
            id="transaction-export-month"
            className={styles.select}
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            disabled={isDownloading}
          >
            {MONTH_OPTIONS.map((option) => (
              <option key={option.value} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formRow}>
          <label className={styles.label} htmlFor="transaction-export-year">
            Year
          </label>
          <select
            id="transaction-export-year"
            className={styles.select}
            value={year}
            onChange={(event) => setYear(event.target.value)}
            disabled={isDownloading}
          >
            {yearOptions.map((optionYear) => (
              <option key={optionYear} value={String(optionYear)}>
                {optionYear}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.exportButtonRow}>
          <button
            type="button"
            className={`${styles.ghostButton} ${styles.exportButton}`}
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? 'Preparing CSV...' : 'Download CSV'}
          </button>
        </div>
      </div>

      {error ? (
        <p className={styles.exportError} role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
