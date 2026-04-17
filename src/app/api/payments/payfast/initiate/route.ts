import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getPayFastEnv, hasPayFastEnv, hasServiceSupabaseEnv } from '@/lib/supabase/env';
import {
  generatePayFastSignature,
  getPayFastProcessUrl,
  PAYFAST_LIVE_MINIMUM_AMOUNT_CENTS,
} from '@/lib/payments/payfast';
import { getSiteUrl } from '@/lib/supabase/site-url';

export const dynamic = 'force-dynamic';

function getNameParts(fullName: string): { firstName: string; lastName: string } {
  const tokens = fullName.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return { firstName: 'Customer', lastName: '' };
  }

  if (tokens.length === 1) {
    return { firstName: tokens[0], lastName: '' };
  }

  return {
    firstName: tokens[0],
    lastName: tokens.slice(1).join(' '),
  };
}

function buildCallbackUrl(
  configuredUrl: string,
  fallbackPath: string,
  siteUrl: string,
  params: Record<string, string>
): string {
  const fallback = new URL(fallbackPath, siteUrl);
  Object.entries(params).forEach(([key, value]) => {
    fallback.searchParams.set(key, value);
  });

  const trimmedConfiguredUrl = configuredUrl.trim();
  if (!trimmedConfiguredUrl) {
    return fallback.toString();
  }

  try {
    const parsed = new URL(trimmedConfiguredUrl, siteUrl);
    Object.entries(params).forEach(([key, value]) => {
      parsed.searchParams.set(key, value);
    });
    return parsed.toString();
  } catch {
    return fallback.toString();
  }
}

export async function POST(request: Request) {
  if (!hasServiceSupabaseEnv) {
    return NextResponse.json({ error: 'Supabase service role key is missing.' }, { status: 503 });
  }

  if (!hasPayFastEnv) {
    return NextResponse.json({ error: 'PayFast environment is not configured.' }, { status: 503 });
  }

  let payload: { orderId?: string };
  try {
    payload = (await request.json()) as { orderId?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid payment initiation payload.' }, { status: 400 });
  }

  const orderId = String(payload.orderId ?? '').trim();

  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required.' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(
      'id, order_number, customer_name, customer_email, total_cents, payment_status, payment_attempt_count'
    )
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message ?? 'Order not found.' }, { status: 404 });
  }

  if (order.payment_status === 'paid') {
    return NextResponse.json({ error: 'Order is already paid.' }, { status: 400 });
  }

  const payfastEnv = getPayFastEnv();

  if (payfastEnv.mode === 'live' && order.total_cents < PAYFAST_LIVE_MINIMUM_AMOUNT_CENTS) {
    const minimum = (PAYFAST_LIVE_MINIMUM_AMOUNT_CENTS / 100).toFixed(2);
    return NextResponse.json(
      {
        error: `PayFast live payments require a minimum order total of R ${minimum}.`,
      },
      { status: 400 }
    );
  }

  const processUrl = getPayFastProcessUrl(payfastEnv.mode);
  const names = getNameParts(order.customer_name);
  const siteUrl = getSiteUrl(request.headers);

  const callbackParams = {
    order: order.order_number,
    orderId: order.id,
  };

  const returnUrl = buildCallbackUrl(
    payfastEnv.returnUrl,
    '/order-confirmation',
    siteUrl,
    callbackParams
  );

  const cancelUrl = buildCallbackUrl(
    payfastEnv.cancelUrl,
    '/checkout',
    siteUrl,
    {
      payment: 'cancelled',
      ...callbackParams,
    }
  );

  const fields: Record<string, string> = {
    merchant_id: payfastEnv.merchantId,
    merchant_key: payfastEnv.merchantKey,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: payfastEnv.notifyUrl,
    name_first: names.firstName,
    name_last: names.lastName,
    email_address: order.customer_email,
    m_payment_id: order.id,
    amount: (order.total_cents / 100).toFixed(2),
    item_name: `Order ${order.order_number}`,
    custom_str1: order.order_number,
  };

  const signature = generatePayFastSignature(fields, payfastEnv.passphrase);

  const { error: updateError } = await supabase
    .from('orders')
    .update({
      payment_method: 'payfast',
      gateway_provider: 'payfast',
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

  const response = NextResponse.json({
    formAction: processUrl,
    fields: {
      ...fields,
      signature,
    },
  });

  response.cookies.set('ze_pending_order', `${order.id}|${order.order_number}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 2 * 60 * 60,
  });

  return response;
}
