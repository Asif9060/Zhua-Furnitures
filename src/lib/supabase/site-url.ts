import 'server-only';

const DEFAULT_CANONICAL_PRODUCTION_SITE_URL = 'https://www.zhuafurniture.com';

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
  const preferredCandidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
  ];

  for (const candidate of preferredCandidates) {
    const normalized = candidate ? normalizeAbsoluteUrl(candidate) : null;
    if (normalized) {
      return normalized;
    }
  }

  const isProductionRuntime = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
  if (isProductionRuntime) {
    const canonical = normalizeAbsoluteUrl(
      process.env.CANONICAL_SITE_URL ?? DEFAULT_CANONICAL_PRODUCTION_SITE_URL
    );
    if (canonical) {
      return canonical;
    }
  }

  const envCandidates = [
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
