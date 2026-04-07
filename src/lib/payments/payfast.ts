import { createHash } from 'crypto';

export type PayFastMode = 'sandbox' | 'live';

function encode(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, '+');
}

function buildSignatureString(
  payload: Record<string, string>,
  passphrase: string
): string {
  const pairs = Object.entries(payload)
    .filter(([key, value]) => key !== 'signature' && value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encode(key)}=${encode(String(value).trim())}`);

  if (passphrase) {
    pairs.push(`passphrase=${encode(passphrase)}`);
  }

  return pairs.join('&');
}

export function generatePayFastSignature(
  payload: Record<string, string>,
  passphrase: string
): string {
  const signatureString = buildSignatureString(payload, passphrase);
  return createHash('md5').update(signatureString).digest('hex');
}

export function verifyPayFastSignature(
  payload: Record<string, string>,
  passphrase: string
): boolean {
  const incomingSignature = String(payload.signature ?? '').trim().toLowerCase();
  if (!incomingSignature) {
    return false;
  }

  const expectedSignature = generatePayFastSignature(payload, passphrase).toLowerCase();
  return incomingSignature === expectedSignature;
}

export function getPayFastProcessUrl(mode: PayFastMode): string {
  return mode === 'live'
    ? 'https://www.payfast.co.za/eng/process'
    : 'https://sandbox.payfast.co.za/eng/process';
}

export function mapPayFastPaymentStatus(value: string): 'paid' | 'pending' | 'failed' {
  const normalized = value.trim().toUpperCase();

  if (normalized === 'COMPLETE') {
    return 'paid';
  }

  if (normalized === 'FAILED' || normalized === 'CANCELLED') {
    return 'failed';
  }

  return 'pending';
}
