import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import {
  displayFulfillmentStatus,
  displayPaymentStatus,
  parseFulfillmentStatus,
  parsePaymentStatus,
} from '@/lib/admin-api';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, customer_name, created_at, total_cents, payment_status, fulfillment_status, order_items(quantity)')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []).map((order) => {
    const itemCount = (order.order_items ?? []).reduce((sum, item) => sum + item.quantity, 0);
    return {
      id: order.id,
      orderNumber: order.order_number,
      customer: order.customer_name,
      date: order.created_at.slice(0, 10),
      total: Math.round(order.total_cents / 100),
      items: itemCount,
      payment: displayPaymentStatus(order.payment_status),
      fulfillment: displayFulfillmentStatus(order.fulfillment_status),
    };
  });

  return NextResponse.json({ orders: rows });
}

export async function POST(request: Request) {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const payload = (await request.json()) as {
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    address?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    deliveryFee?: number;
    total?: number;
    paymentMethod?: string;
    paymentStatus?: string;
    fulfillmentStatus?: string;
  };

  const customerName = String(payload.customerName ?? '').trim();
  const customerEmail = String(payload.customerEmail ?? '').trim();
  const customerPhone = String(payload.customerPhone ?? '').trim();
  const address = String(payload.address ?? '').trim();
  const city = String(payload.city ?? '').trim();
  const province = String(payload.province ?? '').trim();
  const postalCode = String(payload.postalCode ?? '').trim();

  if (!customerName || !customerEmail || !customerPhone || !address || !city || !province || !postalCode) {
    return NextResponse.json({ error: 'Missing required order fields.' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const sequence = Date.now().toString().slice(-6);
  const orderNumber = `ZE-${new Date().getFullYear()}-${sequence}`;

  const { data, error } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      address,
      city,
      province,
      postal_code: postalCode,
      delivery_fee_cents: Math.max(0, Math.round(Number(payload.deliveryFee ?? 0) * 100)),
      total_cents: Math.max(0, Math.round(Number(payload.total ?? 0) * 100)),
      payment_method: payload.paymentMethod || 'placeholder',
      payment_status: parsePaymentStatus(String(payload.paymentStatus ?? 'placeholder')),
      fulfillment_status: parseFulfillmentStatus(String(payload.fulfillmentStatus ?? 'pending')),
    })
    .select('id, order_number, customer_name, created_at, total_cents, payment_status, fulfillment_status')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not create order.' }, { status: 500 });
  }

  return NextResponse.json(
    {
      order: {
        id: data.id,
        orderNumber: data.order_number,
        customer: data.customer_name,
        date: data.created_at.slice(0, 10),
        total: Math.round(data.total_cents / 100),
        payment: displayPaymentStatus(data.payment_status),
        fulfillment: displayFulfillmentStatus(data.fulfillment_status),
      },
    },
    { status: 201 }
  );
}
