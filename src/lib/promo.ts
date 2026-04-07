import type { SupabaseClient } from '@supabase/supabase-js';

export type PromoValidationSuccess = {
  valid: true;
  promo: {
    id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    discountCents: number;
    minOrderCents: number;
    maxDiscountCents: number | null;
    usageLimit: number | null;
    usageLimitPerUser: number | null;
    timesUsed: number;
  };
};

export type PromoValidationFailure = {
  valid: false;
  error: string;
};

export type PromoValidationResult = PromoValidationSuccess | PromoValidationFailure;

function toPromoCode(value: string): string {
  return value.trim().toUpperCase();
}

export async function validatePromoCode({
  supabase,
  code,
  subtotalCents,
  userId,
}: {
  supabase: SupabaseClient;
  code: string;
  subtotalCents: number;
  userId?: string | null;
}): Promise<PromoValidationResult> {
  const normalizedCode = toPromoCode(code);
  if (!normalizedCode) {
    return { valid: false, error: 'Promo code is required.' };
  }

  if (!Number.isFinite(subtotalCents) || subtotalCents <= 0) {
    return { valid: false, error: 'Subtotal must be greater than zero.' };
  }

  const { data: promo, error: promoError } = await supabase
    .from('promo_codes')
    .select(
      'id, code, discount_type, discount_value, min_order_cents, max_discount_cents, usage_limit, usage_limit_per_user, times_used, starts_at, ends_at, is_active'
    )
    .eq('code', normalizedCode)
    .maybeSingle();

  if (promoError) {
    return { valid: false, error: promoError.message };
  }

  if (!promo) {
    return { valid: false, error: 'Promo code was not found.' };
  }

  if (!promo.is_active) {
    return { valid: false, error: 'This promo code is inactive.' };
  }

  const now = new Date();
  const startsAt = promo.starts_at ? new Date(promo.starts_at) : null;
  const endsAt = promo.ends_at ? new Date(promo.ends_at) : null;

  if (startsAt && now < startsAt) {
    return { valid: false, error: 'This promo code is not active yet.' };
  }

  if (endsAt && now > endsAt) {
    return { valid: false, error: 'This promo code has expired.' };
  }

  const minOrderCents = Math.max(0, Number(promo.min_order_cents ?? 0));
  if (subtotalCents < minOrderCents) {
    return {
      valid: false,
      error: `Minimum order value for this promo is R ${(minOrderCents / 100).toFixed(2)}.`,
    };
  }

  const usageLimit = Number.isFinite(Number(promo.usage_limit)) ? Number(promo.usage_limit) : null;
  const timesUsed = Math.max(0, Number(promo.times_used ?? 0));

  if (usageLimit !== null && timesUsed >= usageLimit) {
    return { valid: false, error: 'This promo code has reached its usage limit.' };
  }

  const usageLimitPerUser = Number.isFinite(Number(promo.usage_limit_per_user))
    ? Number(promo.usage_limit_per_user)
    : null;

  if (userId && usageLimitPerUser !== null) {
    const { count, error: countError } = await supabase
      .from('promo_code_redemptions')
      .select('id', { count: 'exact', head: true })
      .eq('promo_code_id', promo.id)
      .eq('user_id', userId);

    if (countError) {
      return { valid: false, error: countError.message };
    }

    if ((count ?? 0) >= usageLimitPerUser) {
      return { valid: false, error: 'You have reached the usage limit for this promo code.' };
    }
  }

  const discountType = promo.discount_type as 'percentage' | 'fixed';
  const discountValue = Number(promo.discount_value ?? 0);

  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return { valid: false, error: 'This promo code has an invalid discount value.' };
  }

  let discountCents =
    discountType === 'percentage'
      ? Math.round((subtotalCents * discountValue) / 100)
      : Math.round(discountValue * 100);

  const maxDiscountCents = Number.isFinite(Number(promo.max_discount_cents))
    ? Math.max(0, Number(promo.max_discount_cents))
    : null;

  if (maxDiscountCents !== null) {
    discountCents = Math.min(discountCents, maxDiscountCents);
  }

  discountCents = Math.max(0, Math.min(subtotalCents, discountCents));

  if (discountCents <= 0) {
    return { valid: false, error: 'This promo code does not apply to your cart.' };
  }

  return {
    valid: true,
    promo: {
      id: promo.id,
      code: normalizedCode,
      discountType,
      discountValue,
      discountCents,
      minOrderCents,
      maxDiscountCents,
      usageLimit,
      usageLimitPerUser,
      timesUsed,
    },
  };
}
