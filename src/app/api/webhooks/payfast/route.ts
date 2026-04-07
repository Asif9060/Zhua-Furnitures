import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getPayFastEnv, hasPayFastEnv, hasServiceSupabaseEnv } from '@/lib/supabase/env';
import {
  mapPayFastPaymentStatus,
  verifyPayFastSignature,
} from '@/lib/payments/payfast';

export const dynamic = 'force-dynamic';

function toCents(value: string): number {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.max(0, Math.round(amount * 100));
}

export async function POST(request: Request) {
  if (!hasServiceSupabaseEnv || !hasPayFastEnv) {
    return new NextResponse('Configuration missing', { status: 503 });
  }

  const payfastEnv = getPayFastEnv();
  const raw = await request.text();
  const params = new URLSearchParams(raw);

  const payload: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    payload[key] = value;
  }

  if (!verifyPayFastSignature(payload, payfastEnv.passphrase)) {
    return new NextResponse('Invalid signature', { status: 400 });
  }

  const orderId = String(payload.m_payment_id ?? '').trim();
  const payfastPaymentId = String(payload.pf_payment_id ?? '').trim();
  const providerStatus = mapPayFastPaymentStatus(String(payload.payment_status ?? ''));

  if (!orderId) {
    return new NextResponse('Missing order reference', { status: 400 });
  }

  const webhookId = `${orderId}:${payfastPaymentId || 'none'}:${providerStatus}`;
  const supabase = createSupabaseAdminClient();

  const { data: existingEvent } = await supabase
    .from('payment_webhook_events')
    .select('id')
    .eq('gateway', 'payfast')
    .eq('webhook_id', webhookId)
    .maybeSingle();

  if (existingEvent?.id) {
    return new NextResponse('OK', { status: 200 });
  }

  const { data: createdEvent, error: createdEventError } = await supabase
    .from('payment_webhook_events')
    .insert({
      gateway: 'payfast',
      webhook_id: webhookId,
      event_type: String(payload.payment_status ?? 'unknown'),
      processing_status: 'received',
      payload,
    })
    .select('id')
    .single();

  if (createdEventError || !createdEvent) {
    return new NextResponse(createdEventError?.message ?? 'Could not record webhook event', {
      status: 500,
    });
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(
      'id, order_number, user_id, promo_code_id, promo_discount_cents, delivery_fee_cents, total_cents, payment_status'
    )
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    await supabase
      .from('payment_webhook_events')
      .update({
        processing_status: 'ignored',
        processed_at: new Date().toISOString(),
        error_message: orderError?.message ?? 'Order not found',
      })
      .eq('id', createdEvent.id);

    return new NextResponse('OK', { status: 200 });
  }

  const nowIso = new Date().toISOString();
  const paymentStatus =
    order.payment_status === 'paid' && providerStatus !== 'failed' ? 'paid' : providerStatus;

  const amountCents = toCents(String(payload.amount_gross ?? '0'));
  const transactionStatus =
    paymentStatus === 'paid' ? 'succeeded' : paymentStatus === 'failed' ? 'failed' : 'pending';
  const idempotencyKey = `payfast:${webhookId}`;

  const { data: existingTransaction } = await supabase
    .from('payment_transactions')
    .select('id')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();

  if (!existingTransaction?.id) {
    const { error: transactionError } = await supabase.from('payment_transactions').insert({
      order_id: order.id,
      gateway: 'payfast',
      transaction_type: 'sale',
      status: transactionStatus,
      amount_cents: amountCents,
      gateway_transaction_id: payfastPaymentId || null,
      idempotency_key: idempotencyKey,
      gateway_response: payload,
      error_message: paymentStatus === 'failed' ? 'PayFast marked payment as failed.' : null,
      attempted_at: nowIso,
      completed_at: paymentStatus === 'pending' ? null : nowIso,
    });

    if (transactionError) {
      await supabase
        .from('payment_webhook_events')
        .update({
          processing_status: 'failed',
          processed_at: nowIso,
          error_message: transactionError.message,
          related_order_id: order.id,
        })
        .eq('id', createdEvent.id);

      return new NextResponse(transactionError.message, { status: 500 });
    }
  }

  const { error: orderUpdateError } = await supabase
    .from('orders')
    .update({
      payment_status: paymentStatus,
      gateway_transaction_id: payfastPaymentId || null,
      payment_error_message:
        paymentStatus === 'failed' ? 'PayFast marked the payment as failed.' : null,
      payment_received_at: paymentStatus === 'paid' ? nowIso : null,
      payment_settled_at: paymentStatus === 'paid' ? nowIso : null,
      remaining_balance_cents: paymentStatus === 'paid' ? 0 : order.total_cents,
    })
    .eq('id', order.id);

  if (orderUpdateError) {
    await supabase
      .from('payment_webhook_events')
      .update({
        processing_status: 'failed',
        processed_at: nowIso,
        error_message: orderUpdateError.message,
        related_order_id: order.id,
      })
      .eq('id', createdEvent.id);

    return new NextResponse(orderUpdateError.message, { status: 500 });
  }

  if (paymentStatus === 'paid' && order.promo_code_id) {
    const { data: redemption } = await supabase
      .from('promo_code_redemptions')
      .select('id')
      .eq('order_id', order.id)
      .eq('promo_code_id', order.promo_code_id)
      .maybeSingle();

    if (!redemption?.id) {
      const { data: promoCode } = await supabase
        .from('promo_codes')
        .select('id, code, times_used')
        .eq('id', order.promo_code_id)
        .maybeSingle();

      if (promoCode?.id) {
        const subtotalCents = Math.max(
          0,
          order.total_cents - order.delivery_fee_cents + order.promo_discount_cents
        );

        const { error: insertRedemptionError } = await supabase.from('promo_code_redemptions').insert({
          promo_code_id: promoCode.id,
          order_id: order.id,
          user_id: order.user_id,
          code_snapshot: promoCode.code,
          subtotal_cents: subtotalCents,
          discount_cents: order.promo_discount_cents,
        });

        if (!insertRedemptionError) {
          await supabase
            .from('promo_codes')
            .update({ times_used: (promoCode.times_used ?? 0) + 1 })
            .eq('id', promoCode.id);
        }
      }
    }
  }

  await supabase
    .from('payment_webhook_events')
    .update({
      processing_status: 'processed',
      processed_at: nowIso,
      related_order_id: order.id,
      processor_attempt_count: 1,
      error_message: null,
    })
    .eq('id', createdEvent.id);

  return new NextResponse('OK', { status: 200 });
}
