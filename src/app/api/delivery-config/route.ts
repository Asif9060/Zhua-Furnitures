import { NextResponse } from 'next/server';
import {
  DEFAULT_DELIVERY_ZONES,
  DEFAULT_DELIVERY_ZONES_DB,
  DEFAULT_FREE_SHIPPING_THRESHOLD,
  DEFAULT_FREE_SHIPPING_THRESHOLD_CENTS,
  centsToRand,
  mapDbZonesToDeliveryZones,
} from '@/lib/delivery';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hasServiceSupabaseEnv } from '@/lib/supabase/env';
import type { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';

type DeliveryZoneRow = Database['public']['Tables']['delivery_zones']['Row'];

export async function GET() {
  if (!hasServiceSupabaseEnv) {
    return NextResponse.json({
      delivery: {
        freeShippingThreshold: DEFAULT_FREE_SHIPPING_THRESHOLD,
        zones: DEFAULT_DELIVERY_ZONES,
      },
    });
  }

  const supabase = createSupabaseAdminClient();
  const { data: settingsData, error: settingsError } = await supabase
    .from('store_settings')
    .select('free_shipping_threshold_cents')
    .eq('id', 'default')
    .maybeSingle();

  if (settingsError) {
    return NextResponse.json({ error: settingsError.message }, { status: 500 });
  }

  const { data: zoneData, error: zoneError } = await supabase
    .from('delivery_zones')
    .select(
      'province_code, province_name, cities, standard_fee_cents, express_fee_cents, standard_days, express_days, is_active, sort_order'
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('province_code', { ascending: true });

  if (zoneError) {
    return NextResponse.json({ error: zoneError.message }, { status: 500 });
  }

  const activeRows = (zoneData ?? []) as Array<
    Pick<
      DeliveryZoneRow,
      | 'province_code'
      | 'province_name'
      | 'cities'
      | 'standard_fee_cents'
      | 'express_fee_cents'
      | 'standard_days'
      | 'express_days'
    >
  >;

  const zonesDb =
    activeRows.length > 0
      ? activeRows.map((row) => ({
          province_code: row.province_code,
          province_name: row.province_name,
          cities: row.cities,
          standard_fee_cents: row.standard_fee_cents,
          express_fee_cents: row.express_fee_cents,
          standard_days: row.standard_days,
          express_days: row.express_days,
        }))
      : DEFAULT_DELIVERY_ZONES_DB;

  const freeShippingThresholdCents =
    settingsData?.free_shipping_threshold_cents ?? DEFAULT_FREE_SHIPPING_THRESHOLD_CENTS;

  return NextResponse.json({
    delivery: {
      freeShippingThreshold: centsToRand(freeShippingThresholdCents),
      zones: mapDbZonesToDeliveryZones(zonesDb),
    },
  });
}
