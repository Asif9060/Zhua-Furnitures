import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/types/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('store_settings')
    .select('id, store_name, support_email, currency, order_prefix, automation')
    .eq('id', 'default')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    settings: data ?? {
      id: 'default',
      store_name: 'Zhua Furniture',
      support_email: 'zhuaenterprise@gmail.com',
      currency: 'ZAR',
      order_prefix: 'ZE-2026',
      automation: {
        autoConfirmPayments: false,
        lowStockAlerts: true,
        reviewModerationQueue: true,
      },
    },
  });
}

export async function PATCH(request: Request) {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const payload = (await request.json()) as {
    storeName?: string;
    supportEmail?: string;
    currency?: string;
    orderPrefix?: string;
    automation?: Record<string, unknown>;
  };

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('store_settings')
    .upsert(
      {
        id: 'default',
        store_name: String(payload.storeName ?? 'Zhua Furniture'),
        support_email: String(payload.supportEmail ?? 'zhuaenterprise@gmail.com'),
        currency: String(payload.currency ?? 'ZAR'),
        order_prefix: String(payload.orderPrefix ?? 'ZE-2026'),
        automation: (payload.automation ?? {
          autoConfirmPayments: false,
          lowStockAlerts: true,
          reviewModerationQueue: true,
        }) as Json,
      },
      { onConflict: 'id' }
    )
    .select('id, store_name, support_email, currency, order_prefix, automation')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not update settings.' }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}
