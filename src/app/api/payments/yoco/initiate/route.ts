import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getYocoEnv, hasServiceSupabaseEnv, hasYocoEnv } from '@/lib/supabase/env';
import { getSiteUrl } from '@/lib/supabase/site-url';
import { getYocoCheckoutApiUrl, parseYocoCheckoutResponse } from '@/lib/payments/yoco';

export const dynamic = 'force-dynamic';

function buildCallbackUrl(
  configuredUrl: string | null,
  fallbackPath: string,
  siteUrl: string,
  orderNumber: string
): string {
  const fallback = new URL(fallbackPath, siteUrl);

  if (fallbackPath === '/order-confirmation') {
    fallback.searchParams.set('order', orderNumber);
  }

  if (!configuredUrl) {
    return fallback.toString();
  }

  try {
    const parsed = new URL(configuredUrl, siteUrl);
    if (fallbackPath === '/order-confirmation' && !parsed.searchParams.get('order')) {
      parsed.searchParams.set('order', orderNumber);
    }
    return parsed.toString();
  } catch {
    return fallback.toString();
  }
}

export async function POST(request: Request) {
  if (!hasServiceSupabaseEnv) {
    return NextResponse.json({ error: 'Supabase service role key is missing.' }, { status: 503 });
  }

  if (!hasYocoEnv) {
    return NextResponse.json({ error: 'Yoco environment is not configured.' }, { status: 503 });
  }

  const payload = (await request.json()) as { orderId?: string };
  const orderId = String(payload.orderId ?? '').trim();

  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required.' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, order_number, total_cents, payment_status, payment_attempt_count')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message ?? 'Order not found.' }, { status: 404 });
  }

  if (order.payment_status === 'paid') {
    return NextResponse.json({ error: 'Order is already paid.' }, { status: 400 });
  }

  const yocoEnv = getYocoEnv();
  const siteUrl = getSiteUrl(request.headers);
  const successUrl = buildCallbackUrl(
    yocoEnv.successUrl,
    '/order-confirmation',
    siteUrl,
    order.order_number
  );
  const cancelUrl = buildCallbackUrl(yocoEnv.cancelUrl, '/checkout', siteUrl, order.order_number);

  const yocoPayload = {
    amount: order.total_cents,
    currency: 'ZAR',
    successUrl,
    cancelUrl,
    failureUrl: cancelUrl,
    metadata: {
      orderId: order.id,
      orderNumber: order.order_number,
    },
    reference: order.order_number,
  };

  let yocoResponse: Response;
  try {
    yocoResponse = await fetch(getYocoCheckoutApiUrl(yocoEnv.mode), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${yocoEnv.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(yocoPayload),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ error: 'Could not connect to Yoco.' }, { status: 502 });
  }

  const responseText = await yocoResponse.text();
  let responseJson: unknown = {};

  if (responseText) {
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      responseJson = {};
    }
  }

  if (!yocoResponse.ok) {
    const message =
      typeof responseJson === 'object' && responseJson !== null && 'message' in responseJson
        ? String((responseJson as { message?: string }).message ?? '').trim()
        : '';

    return NextResponse.json(
      { error: message || 'Could not initialize Yoco checkout.' },
      { status: 502 }
    );
  }

  const checkout = parseYocoCheckoutResponse(responseJson);
  if (!checkout.redirectUrl) {
    return NextResponse.json({ error: 'Yoco checkout URL is missing.' }, { status: 502 });
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({
      payment_method: 'yoco',
      gateway_provider: 'yoco',
      payment_session_id: checkout.sessionId,
      payment_reference: order.order_number,
      payment_attempt_count: (order.payment_attempt_count ?? 0) + 1,
      last_payment_attempt_at: new Date().toISOString(),
      payment_status:
        order.payment_status === 'failed' || order.payment_status === 'placeholder'
          ? 'awaiting_payment'
          : order.payment_status,
    })
    .eq('id', order.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    redirectUrl: checkout.redirectUrl,
    sessionId: checkout.sessionId,
  });
}
