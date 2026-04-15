const DEFAULT_CANONICAL_SITE_URL = 'https://www.zhuafurniture.com';

export function getCanonicalSiteUrl(): string {
  const rawValue =
    process.env.CANONICAL_SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    DEFAULT_CANONICAL_SITE_URL;

  try {
    const parsed = new URL(rawValue);
    if (parsed.hostname === 'zhuafurniture.com') {
      parsed.hostname = 'www.zhuafurniture.com';
    }

    return parsed.origin;
  } catch {
    return DEFAULT_CANONICAL_SITE_URL;
  }
}