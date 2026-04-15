'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/admin/admin-pages.module.css';

const REFRESH_INTERVAL_MS = 30_000;

function formatLastUpdated(value: Date): string {
  return value.toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export default function AdminOverviewAutoRefresh() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date());

  const label = useMemo(() => {
    if (!lastUpdated) {
      return '--:--:--';
    }

    return formatLastUpdated(lastUpdated);
  }, [lastUpdated]);

  useEffect(() => {
    const handleVisibility = () => {
      setEnabled(document.visibilityState === 'visible');
    };

    handleVisibility();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const timer = window.setInterval(() => {
      router.refresh();
      setLastUpdated(new Date());
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [enabled, router]);

  return (
    <div className={styles.liveMeta}>
      <span className={styles.liveDot} aria-hidden>
        ●
      </span>
      <span>Live updates every 30s</span>
      <span className={styles.liveDivider}>|</span>
      <span>Last update: {label}</span>
      {!enabled ? <span className={styles.livePaused}>(paused in background tab)</span> : null}
    </div>
  );
}
