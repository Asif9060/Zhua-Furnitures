import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import {
  DEFAULT_DELIVERY_ZONES_DB,
  DEFAULT_FREE_SHIPPING_THRESHOLD_CENTS,
  centsToRand,
  mapDbZonesToDeliveryZones,
  randToCents,
} from '@/lib/delivery';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hasServiceSupabaseEnv } from '@/lib/supabase/env';
import type { Json, Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';

type DeliveryZoneRow = Database['public']['Tables']['delivery_zones']['Row'];
type DeliveryZoneInsert = Database['public']['Tables']['delivery_zones']['Insert'];
type DeliveryPatchZone = {
  id?: string;
  name?: string;
  cities?: string[];
  standardFee?: number;
  expressFee?: number;
  standardDays?: string;
  expressDays?: string;
};

type DeliveryPatchPayload = {
  freeShippingThreshold?: number;
  zones?: DeliveryPatchZone[];
};

function normalizeZoneInput(
  value: DeliveryPatchZone,
  index: number
): DeliveryZoneInsert {
  const code = String(value.id ?? '').trim().toUpperCase();
  if (!code) {
    throw new Error(`Delivery zone at row ${index + 1} is missing a province code.`);
  }

  const name = String(value.name ?? '').trim();
  if (!name) {
    throw new Error(`Delivery zone ${code} is missing a province name.`);
  }

  const standardDays = String(value.standardDays ?? '').trim();
  const expressDays = String(value.expressDays ?? '').trim();
  if (!standardDays || !expressDays) {
    throw new Error(`Delivery zone ${code} must include both standard and express days.`);
  }

  const standardFee = Number(value.standardFee ?? 0);
  const expressFee = Number(value.expressFee ?? 0);
  if (!Number.isFinite(standardFee) || standardFee < 0) {
    throw new Error(`Delivery zone ${code} has an invalid standard fee.`);
  }
  if (!Number.isFinite(expressFee) || expressFee < 0) {
    throw new Error(`Delivery zone ${code} has an invalid express fee.`);
  }

  const cities = Array.isArray(value.cities)
    ? value.cities.map((city: string) => String(city).trim()).filter(Boolean)
    : [];

  return {
    province_code: code,
    province_name: name,
    cities,
    standard_fee_cents: randToCents(standardFee),
    express_fee_cents: randToCents(expressFee),
    standard_days: standardDays,
    express_days: expressDays,
    is_active: true,
    sort_order: index + 1,
  };
}

async function getDeliveryConfigRows(supabase: ReturnType<typeof createSupabaseAdminClient>) {
  const { data: settingsData, error: settingsError } = await supabase
    .from('store_settings')
    .select('free_shipping_threshold_cents')
    .eq('id', 'default')
    .maybeSingle();

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  const { data: zoneData, error: zonesError } = await supabase
    .from('delivery_zones')
    .select(
      'province_code, province_name, cities, standard_fee_cents, express_fee_cents, standard_days, express_days, is_active, sort_order'
    )
    .order('sort_order', { ascending: true })
    .order('province_code', { ascending: true });

  if (zonesError) {
    throw new Error(zonesError.message);
  }

  const activeRows =
    (zoneData ?? []).filter((row) => row.is_active) as Array<
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

  const zonesDb = activeRows.length > 0
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

  return {
    freeShippingThreshold: centsToRand(freeShippingThresholdCents),
    zones: mapDbZonesToDeliveryZones(zonesDb),
  };
}

export async function GET() {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  if (!hasServiceSupabaseEnv) {
    return NextResponse.json({ error: 'Supabase service role key is missing.' }, { status: 503 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const delivery = await getDeliveryConfigRows(supabase);
    return NextResponse.json({ delivery });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load delivery settings.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  if (!hasServiceSupabaseEnv) {
    return NextResponse.json({ error: 'Supabase service role key is missing.' }, { status: 503 });
  }

  try {
    const payload = (await request.json()) as DeliveryPatchPayload;
    const freeShippingThreshold = Number(payload.freeShippingThreshold ?? 0);

    if (!Number.isFinite(freeShippingThreshold) || freeShippingThreshold < 0) {
      return NextResponse.json({ error: 'Free shipping threshold must be a valid amount.' }, { status: 400 });
    }

    if (!Array.isArray(payload.zones) || payload.zones.length === 0) {
      return NextResponse.json({ error: 'At least one delivery zone is required.' }, { status: 400 });
    }

    const zoneRows = payload.zones.map((zone, index) => normalizeZoneInput(zone, index));
    const allCodes = zoneRows.map((zone) => zone.province_code);

    const supabase = createSupabaseAdminClient();

    const { data: existingSettings, error: existingSettingsError } = await supabase
      .from('store_settings')
      .select('id, store_name, support_email, currency, order_prefix, automation')
      .eq('id', 'default')
      .maybeSingle();

    if (existingSettingsError) {
      return NextResponse.json({ error: existingSettingsError.message }, { status: 500 });
    }

    const { error: settingsError } = await supabase
      .from('store_settings')
      .upsert(
        {
          id: 'default',
          store_name: existingSettings?.store_name ?? 'Zhua Enterprises',
          support_email: existingSettings?.support_email ?? 'hello@zhuaenterprises.co.za',
          currency: existingSettings?.currency ?? 'ZAR',
          order_prefix: existingSettings?.order_prefix ?? `ZE-${new Date().getFullYear()}`,
          automation:
            (existingSettings?.automation ?? {
              autoConfirmPayments: false,
              lowStockAlerts: true,
              reviewModerationQueue: true,
            }) as Json,
          free_shipping_threshold_cents: randToCents(freeShippingThreshold),
        },
        { onConflict: 'id' }
      );

    if (settingsError) {
      return NextResponse.json({ error: settingsError.message }, { status: 500 });
    }

    const { error: zonesError } = await supabase
      .from('delivery_zones')
      .upsert(zoneRows, { onConflict: 'province_code' });

    if (zonesError) {
      return NextResponse.json({ error: zonesError.message }, { status: 500 });
    }

    const { error: deactivateError } = await supabase
      .from('delivery_zones')
      .update({ is_active: false })
      .not('province_code', 'in', `(${allCodes.map((code) => `"${code}"`).join(',')})`);

    if (deactivateError) {
      return NextResponse.json({ error: deactivateError.message }, { status: 500 });
    }

    const delivery = await getDeliveryConfigRows(supabase);
    return NextResponse.json({ delivery });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update delivery settings.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
