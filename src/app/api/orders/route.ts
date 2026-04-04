import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hasPublicSupabaseEnv, hasServiceSupabaseEnv } from '@/lib/supabase/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type CheckoutItem = {
  productId?: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  selectedFabric?: string;
  customNote?: string;
};

type CheckoutPayload = {
  delivery: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    deliveryType: string;
  };
  paymentMethod: string;
  deliveryFee: number;
  total: number;
  items: CheckoutItem[];
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: Request) {
  if (!hasServiceSupabaseEnv) {
    return NextResponse.json({ error: 'Supabase service role key is missing.' }, { status: 503 });
  }

  const payload = (await request.json()) as CheckoutPayload;

  if (!payload?.delivery || !Array.isArray(payload.items) || payload.items.length === 0) {
    return NextResponse.json({ error: 'Invalid checkout payload.' }, { status: 400 });
  }

  const delivery = payload.delivery;
  if (
    !delivery.name ||
    !delivery.email ||
    !delivery.phone ||
    !delivery.address ||
    !delivery.city ||
    !delivery.province ||
    !delivery.postalCode
  ) {
    return NextResponse.json({ error: 'Delivery details are incomplete.' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  const { data: settingsData } = await supabase
    .from('store_settings')
    .select('order_prefix')
    .eq('id', 'default')
    .maybeSingle();

  const prefix = settingsData?.order_prefix ?? `ZE-${new Date().getFullYear()}`;
  const orderNumber = `${prefix}-${Date.now().toString().slice(-6)}`;

  let userId: string | null = null;
  if (hasPublicSupabaseEnv) {
    const authClient = await createSupabaseServerClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    userId = user?.id ?? null;
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      user_id: userId,
      customer_name: delivery.name,
      customer_email: delivery.email,
      customer_phone: delivery.phone,
      address: delivery.address,
      city: delivery.city,
      province: delivery.province,
      postal_code: delivery.postalCode,
      delivery_type: delivery.deliveryType || 'standard',
      delivery_fee_cents: Math.max(0, Math.round(payload.deliveryFee * 100)),
      total_cents: Math.max(0, Math.round(payload.total * 100)),
      payment_method: payload.paymentMethod || 'placeholder',
      payment_status: 'placeholder',
      fulfillment_status: 'pending',
    })
    .select('id, order_number')
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message ?? 'Could not create order.' }, { status: 500 });
  }

  const orderItems = payload.items.map((item) => {
    const unitPriceCents = Math.max(0, Math.round(item.unitPrice * 100));
    const quantity = Math.max(1, Math.round(item.quantity));

    return {
      order_id: order.id,
      product_id: item.productId && isUuid(item.productId) ? item.productId : null,
      product_name: item.productName,
      unit_price_cents: unitPriceCents,
      quantity,
      line_total_cents: unitPriceCents * quantity,
      selected_color: item.selectedColor ?? null,
      selected_size: item.selectedSize ?? null,
      selected_fabric: item.selectedFabric ?? null,
      custom_note: item.customNote ?? null,
    };
  });

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
  if (itemsError) {
    await supabase.from('orders').delete().eq('id', order.id);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.order_number,
  });
}
