import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type DiscountType = 'percentage' | 'fixed';

function parseDiscountType(value: string): DiscountType {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'percentage' || normalized === 'fixed') {
    return normalized;
  }

  return 'percentage';
}

function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase();
}

export async function GET() {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('promo_codes')
    .select(
      'id, code, description, discount_type, discount_value, min_order_cents, max_discount_cents, usage_limit, usage_limit_per_user, times_used, starts_at, ends_at, is_active, created_at, updated_at'
    )
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const promoCodes = (data ?? []).map((row) => ({
    id: row.id,
    code: row.code,
    description: row.description,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value ?? 0),
    minOrderCents: row.min_order_cents,
    maxDiscountCents: row.max_discount_cents,
    usageLimit: row.usage_limit,
    usageLimitPerUser: row.usage_limit_per_user,
    timesUsed: row.times_used,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return NextResponse.json({ promoCodes });
}

export async function POST(request: Request) {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const payload = (await request.json()) as {
    code?: string;
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

  const code = normalizePromoCode(String(payload.code ?? ''));
  if (!code) {
    return NextResponse.json({ error: 'Promo code is required.' }, { status: 400 });
  }

  const discountValue = Number(payload.discountValue ?? 0);
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return NextResponse.json({ error: 'Discount value must be greater than zero.' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('promo_codes')
    .insert({
      code,
      description: String(payload.description ?? '').trim(),
      discount_type: parseDiscountType(String(payload.discountType ?? 'percentage')),
      discount_value: discountValue,
      min_order_cents: Math.max(0, Math.round(Number(payload.minOrderCents ?? 0))),
      max_discount_cents:
        payload.maxDiscountCents == null ? null : Math.max(0, Math.round(Number(payload.maxDiscountCents))),
      usage_limit: payload.usageLimit == null ? null : Math.max(0, Math.round(Number(payload.usageLimit))),
      usage_limit_per_user:
        payload.usageLimitPerUser == null
          ? null
          : Math.max(0, Math.round(Number(payload.usageLimitPerUser))),
      starts_at: payload.startsAt ? payload.startsAt : null,
      ends_at: payload.endsAt ? payload.endsAt : null,
      is_active: payload.isActive ?? true,
    })
    .select(
      'id, code, description, discount_type, discount_value, min_order_cents, max_discount_cents, usage_limit, usage_limit_per_user, times_used, starts_at, ends_at, is_active, created_at, updated_at'
    )
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not create promo code.' }, { status: 500 });
  }

  return NextResponse.json(
    {
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
    },
    { status: 201 }
  );
}
