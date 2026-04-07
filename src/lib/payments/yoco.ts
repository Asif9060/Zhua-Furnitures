import { createHmac, timingSafeEqual } from 'crypto';

export type YocoMode = 'sandbox' | 'live';

type AnyRecord = Record<string, unknown>;

function readString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function normalizeSignature(value: string): string {
  return value.replace(/^sha256=/i, '').trim();
}

function equalsSafely(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function getYocoCheckoutApiUrl(mode: YocoMode): string {
  void mode;
  // Yoco currently uses a single checkout endpoint for sandbox and live keys.
  return 'https://payments.yoco.com/api/checkouts';
}

export function getYocoWebhookSignature(headers: Headers): string {
  return (
    headers.get('webhook-signature') ??
    headers.get('x-yoco-signature') ??
    headers.get('x-signature') ??
    ''
  );
}

export function verifyYocoWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  webhookSecret: string
): boolean {
  const normalizedHeader = signatureHeader.trim();
  if (!normalizedHeader || !webhookSecret) {
    return false;
  }

  const candidates = normalizedHeader
    .split(',')
    .map((candidate) => normalizeSignature(candidate))
    .filter(Boolean);

  if (candidates.length === 0) {
    return false;
  }

  const expectedHex = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  const expectedBase64 = createHmac('sha256', webhookSecret).update(rawBody).digest('base64');

  return candidates.some(
    (candidate) =>
      equalsSafely(candidate.toLowerCase(), expectedHex.toLowerCase()) ||
      equalsSafely(candidate, expectedBase64)
  );
}

export function mapYocoPaymentStatus(value: string): 'paid' | 'pending' | 'failed' {
  const normalized = value.trim().toLowerCase();

  if (
    normalized === 'succeeded' ||
    normalized === 'successful' ||
    normalized === 'paid' ||
    normalized === 'complete' ||
    normalized === 'completed'
  ) {
    return 'paid';
  }

  if (
    normalized === 'failed' ||
    normalized === 'cancelled' ||
    normalized === 'canceled' ||
    normalized === 'declined' ||
    normalized === 'error'
  ) {
    return 'failed';
  }

  return 'pending';
}

export function parseYocoCheckoutResponse(payload: unknown): {
  sessionId: string | null;
  redirectUrl: string | null;
} {
  const body = (payload ?? {}) as AnyRecord;

  return {
    sessionId:
      readString(body.id) ??
      readString(body.checkoutId) ??
      readString(body.checkout_id) ??
      readString(body.sessionId) ??
      readString(body.session_id),
    redirectUrl:
      readString(body.redirectUrl) ??
      readString(body.redirect_url) ??
      readString(body.url) ??
      readString(body.checkoutUrl),
  };
}
