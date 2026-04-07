import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type DiscountType = 'percentage' | 'fixed';

function parseDiscountType(value: string): DiscountType {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'percentage' || normalized === 'fixed') {
    return normalized;
  }

  return 'percentage';
}

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const { id } = await params;
  const payload = (await request.json()) as {
    description?: string;
    discountType?: string;
    discountValue?: number;
    minOrderCents?: number;
    maxDiscountCents?: number | null;
    usageLimit?: number | null;
    usageLimitPerUser?: number | null;
    startsAt?: string | null;
    endsAt?: string | null;
    isActive?: boolean;
  };

  const updateData: Record<string, unknown> = {};

  if (payload.description !== undefined) {
    updateData.description = String(payload.description).trim();
  }

  if (payload.discountType !== undefined) {
    updateData.discount_type = parseDiscountType(String(payload.discountType));
  }

  if (payload.discountValue !== undefined) {
    const discountValue = Number(payload.discountValue);
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      return NextResponse.json({ error: 'Discount value must be greater than zero.' }, { status: 400 });
    }
    updateData.discount_value = discountValue;
  }

  if (payload.minOrderCents !== undefined) {
    updateData.min_order_cents = Math.max(0, Math.round(Number(payload.minOrderCents)));
  }

  if (payload.maxDiscountCents !== undefined) {
    updateData.max_discount_cents =
      payload.maxDiscountCents == null ? null : Math.max(0, Math.round(Number(payload.maxDiscountCents)));
  }

  if (payload.usageLimit !== undefined) {
    updateData.usage_limit =
      payload.usageLimit == null ? null : Math.max(0, Math.round(Number(payload.usageLimit)));
  }

  if (payload.usageLimitPerUser !== undefined) {
    updateData.usage_limit_per_user =
      payload.usageLimitPerUser == null
        ? null
        : Math.max(0, Math.round(Number(payload.usageLimitPerUser)));
  }

  if (payload.startsAt !== undefined) {
    updateData.starts_at = payload.startsAt || null;
  }

  if (payload.endsAt !== undefined) {
    updateData.ends_at = payload.endsAt || null;
  }

  if (payload.isActive !== undefined) {
    updateData.is_active = Boolean(payload.isActive);
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('promo_codes')
    .update(updateData)
    .eq('id', id)
    .select(
      'id, code, description, discount_type, discount_value, min_order_cents, max_discount_cents, usage_limit, usage_limit_per_user, times_used, starts_at, ends_at, is_active, created_at, updated_at'
    )
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not update promo code.' }, { status: 500 });
  }

  return NextResponse.json({
    promoCode: {
      id: data.id,
      code: data.code,
      description: data.description,
      discountType: data.discount_type,
      discountValue: Number(data.discount_value ?? 0),
      minOrderCents: data.min_order_cents,
      maxDiscountCents: data.max_discount_cents,
      usageLimit: data.usage_limit,
      usageLimitPerUser: data.usage_limit_per_user,
      timesUsed: data.times_used,
      startsAt: data.starts_at,
      endsAt: data.ends_at,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('promo_codes').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
