export interface CloudinaryImageAsset {
  publicId: string;
  secureUrl: string;
  alt: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  createdAt?: string;
}

export interface ContentBlockPayload {
  headline?: string;
  cta?: string;
  supportingCopy?: string;
  heroImage?: CloudinaryImageAsset;
  secondaryImage?: CloudinaryImageAsset;
  gallery?: CloudinaryImageAsset[];
}

function isCloudinaryUrl(value: string): boolean {
  return /^https:\/\/res\.cloudinary\.com\//i.test(value);
}

function sanitizeText(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') {
    return fallback;
  }

  return value.trim();
}

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }

  return value;
}

export function normalizeCloudinaryImageAsset(value: unknown): CloudinaryImageAsset | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const publicId = sanitizeText(candidate.publicId);
  const secureUrl = sanitizeText(candidate.secureUrl);

  if (!publicId || !secureUrl || !isCloudinaryUrl(secureUrl) || publicId.includes('..')) {
    return null;
  }

  return {
    publicId,
    secureUrl,
    alt: sanitizeText(candidate.alt, ''),
    width: toOptionalNumber(candidate.width),
    height: toOptionalNumber(candidate.height),
    format: sanitizeText(candidate.format, ''),
    bytes: toOptionalNumber(candidate.bytes),
    createdAt: sanitizeText(candidate.createdAt, ''),
  };
}

export function normalizeCloudinaryImageAssets(value: unknown): CloudinaryImageAsset[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((asset) => normalizeCloudinaryImageAsset(asset))
    .filter((asset): asset is CloudinaryImageAsset => asset !== null);
}

function toObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

export function normalizeContentBlockPayload(value: unknown): ContentBlockPayload {
  const payload = toObject(value);

  const next: ContentBlockPayload = {};
  const headline = sanitizeText(payload.headline);
  const cta = sanitizeText(payload.cta);
  const supportingCopy = sanitizeText(payload.supportingCopy);

  if (headline) {
    next.headline = headline;
  }

  if (cta) {
    next.cta = cta;
  }

  if (supportingCopy) {
    next.supportingCopy = supportingCopy;
  }

  const heroImage = normalizeCloudinaryImageAsset(payload.heroImage);
  if (heroImage) {
    next.heroImage = heroImage;
  }

  const secondaryImage = normalizeCloudinaryImageAsset(payload.secondaryImage);
  if (secondaryImage) {
    next.secondaryImage = secondaryImage;
  }

  const gallery = normalizeCloudinaryImageAssets(payload.gallery);
  if (gallery.length > 0) {
    next.gallery = gallery;
  }

  return next;
}
