import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hasServiceSupabaseEnv } from '@/lib/supabase/env';
import { displayFulfillmentStatus, displayPaymentStatus } from '@/lib/admin-api';
import { normalizeEmail, normalizePhone } from '@/lib/order-linking';

export const dynamic = 'force-dynamic';

function resolveProgressStep(fulfillmentStatus: string): number {
  switch (fulfillmentStatus) {
    case 'delivered':
      return 4;
    case 'shipped':
      return 3;
    case 'processing':
      return 2;
    case 'cancelled':
      return 1;
    case 'pending':
    default:
      return 1;
  }
}

export async function POST(request: Request) {
  if (!hasServiceSupabaseEnv) {
    return NextResponse.json({ error: 'Service configuration is missing.' }, { status: 503 });
  }

  const payload = (await request.json()) as {
    orderNumber?: string;
    email?: string;
    phone?: string;
  };

  const orderNumber = String(payload.orderNumber ?? '').trim().toUpperCase();
  const email = normalizeEmail(payload.email);
  const phone = normalizePhone(payload.phone);

  if (!orderNumber) {
    return NextResponse.json({ error: 'Order number is required.' }, { status: 400 });
  }

  if (!email && !phone) {
    return NextResponse.json({ error: 'Provide your order email or phone number.' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: order, error } = await supabase
    .from('orders')
    .select(
      'id, order_number, customer_email, customer_phone, created_at, total_cents, payment_status, fulfillment_status'
    )
    .eq('order_number', orderNumber)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  const orderEmail = normalizeEmail(order.customer_email);
  const orderPhone = normalizePhone(order.customer_phone);
  const identityMatches = (email && email === orderEmail) || (phone && phone === orderPhone);

  if (!identityMatches) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  return NextResponse.json({
    order: {
      id: order.id,
      orderNumber: order.order_number,
      placedAt: order.created_at,
      totalCents: order.total_cents,
      paymentStatus: displayPaymentStatus(order.payment_status),
      fulfillmentStatus: displayFulfillmentStatus(order.fulfillment_status),
      progressStep: resolveProgressStep(order.fulfillment_status),
      isCancelled: order.fulfillment_status === 'cancelled',
    },
  });
}
