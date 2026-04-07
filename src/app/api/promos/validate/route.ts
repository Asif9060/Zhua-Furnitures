import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasPublicSupabaseEnv, hasServiceSupabaseEnv } from '@/lib/supabase/env';
import { validatePromoCode } from '@/lib/promo';

export const dynamic = 'force-dynamic';

type PromoValidationPayload = {
  code?: string;
  subtotal?: number;
  subtotalCents?: number;
};

export async function POST(request: Request) {
  if (!hasServiceSupabaseEnv) {
    return NextResponse.json({ error: 'Supabase service role key is missing.' }, { status: 503 });
  }

  const payload = (await request.json()) as PromoValidationPayload;
  const code = String(payload.code ?? '').trim();

  const subtotalCents = Number.isFinite(Number(payload.subtotalCents))
    ? Math.max(0, Math.round(Number(payload.subtotalCents)))
    : Math.max(0, Math.round(Number(payload.subtotal ?? 0) * 100));

  if (!code) {
    return NextResponse.json({ error: 'Promo code is required.' }, { status: 400 });
  }

  let userId: string | null = null;
  if (hasPublicSupabaseEnv) {
    const authClient = await createSupabaseServerClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    userId = user?.id ?? null;
  }

  const supabase = createSupabaseAdminClient();
  const result = await validatePromoCode({
    supabase,
    code,
    subtotalCents,
    userId,
  });

  if (!result.valid) {
    return NextResponse.json({ valid: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    valid: true,
    promo: {
      ...result.promo,
      discountAmount: Number((result.promo.discountCents / 100).toFixed(2)),
    },
  });
}
