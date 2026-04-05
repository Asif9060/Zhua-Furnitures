import 'server-only';

function normalizeAbsoluteUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  const candidate = value.startsWith('http://') || value.startsWith('https://')
    ? value
    : `https://${value}`;

  try {
    const parsed = new URL(candidate);
    return `${parsed.protocol}//${parsed.host}`.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

export function getSiteUrl(headerStore?: Headers): string {
  const envCandidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];

  for (const candidate of envCandidates) {
    const normalized = candidate ? normalizeAbsoluteUrl(candidate) : null;
    if (normalized) {
      return normalized;
    }
  }

  if (headerStore) {
    const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host');
    if (host) {
      const proto = headerStore.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https');
      return `${proto}://${host}`.replace(/\/+$/, '');
    }
  }

  return 'http://localhost:3000';
}
