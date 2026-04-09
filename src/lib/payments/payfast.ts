import { createHash } from 'crypto';

export type PayFastMode = 'sandbox' | 'live';

/**
 * PayFast requires x-www-form-urlencoded encoding
 * Spaces must be converted to "+"
 */
function encode(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, '+');
}

/**
 * Build signature string
 */
function buildSignatureString(
  payload: Record<string, any>,
  passphrase: string,
  sortKeys: boolean = false
): string {
  let entries = Object.entries(payload)
    .filter(([key, value]) =>
      key !== 'signature' &&
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ''
    );

  // 🔑 IMPORTANT:
  // - NO sorting for payment request
  // - SORTED for ITN verification
  if (sortKeys) {
    entries = entries.sort(([a], [b]) => a.localeCompare(b));
  }

  const pairs = entries.map(([key, value]) => {
    return `${encode(key)}=${encode(String(value).trim())}`;
  });

  // Append passphrase if exists
  const cleanPassphrase = passphrase?.trim();
  if (cleanPassphrase) {
    pairs.push(`passphrase=${encode(cleanPassphrase)}`);
  }

  const signatureString = pairs.join('&');

  // 🧪 Debug (VERY IMPORTANT for fixing mismatch issues)
  // console.log('Signature String:', signatureString);

  return signatureString;
}

/**
 * Generate signature
 */
export function generatePayFastSignature(
  payload: Record<string, any>,
  passphrase: string,
  sortKeys: boolean = false
): string {
  const signatureString = buildSignatureString(payload, passphrase, sortKeys);

  return createHash('md5')
    .update(signatureString)
    .digest('hex');
}

/**
 * Verify ITN signature (PayFast callback)
 */
export function verifyPayFastSignature(
  payload: Record<string, any>,
  passphrase: string
): boolean {
  const incomingSignature = String(payload.signature || '')
    .trim()
    .toLowerCase();

  if (!incomingSignature) return false;

  // ✅ PayFast ITN MUST use sorted keys
  const expectedSignature = generatePayFastSignature(
    payload,
    passphrase,
    true
  ).toLowerCase();

  return incomingSignature === expectedSignature;
}

/**
 * PayFast process URL
 */
export function getPayFastProcessUrl(mode: PayFastMode): string {
  return mode === 'live'
    ? 'https://www.payfast.co.za/eng/process'
    : 'https://sandbox.payfast.co.za/eng/process';
}

/**
 * Normalize payment status
 */
export function mapPayFastPaymentStatus(
  value: string
): 'paid' | 'pending' | 'failed' {
  const normalized = value?.trim().toUpperCase();

  if (normalized === 'COMPLETE') return 'paid';

  if (normalized === 'FAILED' || normalized === 'CANCELLED') {
    return 'failed';
  }

  return 'pending';
}