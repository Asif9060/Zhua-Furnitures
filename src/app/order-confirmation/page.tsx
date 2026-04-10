import Link from 'next/link';
import { CheckCircle, Package, Truck, MessageCircle } from 'lucide-react';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hasServiceSupabaseEnv } from '@/lib/supabase/env';

type ConfirmationSearchParams = {
  order?: string;
  orderId?: string;
  m_payment_id?: string;
  custom_str1?: string;
  payment_status?: string;
};

type ConfirmedOrder = {
  id: string;
  order_number: string;
  created_at: string;
  total_cents: number;
  payment_status: string;
  fulfillment_status: string;
  order_items: Array<{
    product_id: string | null;
    product_name: string;
    quantity: number;
    line_total_cents: number;
  }>;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function toTitleLabel(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatOrderCurrency(totalCents: number): string {
  const amount = Math.max(0, totalCents) / 100;
  return `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function getOrderForConfirmation(
  orderIdCandidate: string,
  orderNumberCandidate: string
): Promise<ConfirmedOrder | null> {
  if (!hasServiceSupabaseEnv) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const selectClause =
    'id, order_number, created_at, total_cents, payment_status, fulfillment_status, order_items(product_id, product_name, quantity, line_total_cents)';

  if (isUuid(orderIdCandidate)) {
    const { data } = await supabase
      .from('orders')
      .select(selectClause)
      .eq('id', orderIdCandidate)
      .maybeSingle();

    if (data) {
      return data as ConfirmedOrder;
    }
  }

  if (orderNumberCandidate) {
    const { data } = await supabase
      .from('orders')
      .select(selectClause)
      .eq('order_number', orderNumberCandidate)
      .maybeSingle();

    if (data) {
      return data as ConfirmedOrder;
    }
  }

  return null;
}

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<ConfirmationSearchParams>;
}) {
  const params = await searchParams;
  const orderIdCandidate = String(params.orderId ?? params.m_payment_id ?? '').trim();
  const orderNumberCandidate = String(params.order ?? params.custom_str1 ?? '').trim();
  const confirmedOrder = await getOrderForConfirmation(orderIdCandidate, orderNumberCandidate);

  const orderNum = confirmedOrder?.order_number || orderNumberCandidate || 'ZE-000000';
  const paymentStatusLabel = confirmedOrder
    ? toTitleLabel(confirmedOrder.payment_status)
    : params.payment_status
      ? toTitleLabel(params.payment_status)
      : 'Pending';
  const fulfillmentStatusLabel = confirmedOrder
    ? toTitleLabel(confirmedOrder.fulfillment_status)
    : 'Pending';
  const orderItems = confirmedOrder?.order_items ?? [];
  const totalLabel = confirmedOrder ? formatOrderCurrency(confirmedOrder.total_cents) : null;

  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container" style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, background: 'rgba(78,205,196,0.1)', border: '1px solid rgba(78,205,196,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
          <CheckCircle size={40} color="#4ECDC4" />
        </div>
        <span className="label-accent">Order Received</span>
        <h1 className="heading-xl" style={{ color: '#EAF0F8', margin: '1rem 0', fontSize: '2.5rem' }}>We Are Verifying Your Payment</h1>
        <p style={{ color: '#A9B7C9', fontSize: '1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
          Your order <strong style={{ color: '#B59241' }}>{orderNum}</strong> has been created. We&apos;ll confirm payment and continue fulfillment as soon as your gateway response is received.
        </p>

        {confirmedOrder ? (
          <div
            style={{
              textAlign: 'left',
              background: '#163250',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14,
              padding: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <p style={{ color: '#A9B7C9', margin: 0 }}>Order ID: <span style={{ color: '#EAF0F8' }}>{confirmedOrder.id}</span></p>
            <p style={{ color: '#A9B7C9', margin: '0.3rem 0 0' }}>Payment: <span style={{ color: '#EAF0F8' }}>{paymentStatusLabel}</span></p>
            <p style={{ color: '#A9B7C9', margin: '0.3rem 0 0' }}>Fulfillment: <span style={{ color: '#EAF0F8' }}>{fulfillmentStatusLabel}</span></p>
            {totalLabel ? (
              <p style={{ color: '#A9B7C9', margin: '0.3rem 0 0' }}>Total: <span style={{ color: '#EAF0F8' }}>{totalLabel}</span></p>
            ) : null}

            <div style={{ marginTop: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.7rem' }}>
              <p style={{ color: '#B59241', margin: '0 0 0.6rem', fontWeight: 700 }}>Ordered Products</p>
              {orderItems.length === 0 ? (
                <p style={{ color: '#A9B7C9', margin: 0 }}>No line items found yet.</p>
              ) : (
                <div style={{ display: 'grid', gap: '0.6rem' }}>
                  {orderItems.map((item, index) => (
                    <div key={`${item.product_name}-${index}`} style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '0.7rem' }}>
                      <p style={{ color: '#EAF0F8', margin: 0, fontWeight: 600 }}>{item.product_name}</p>
                      <p style={{ color: '#A9B7C9', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Product ID: {item.product_id ?? 'N/A'}</p>
                      <p style={{ color: '#A9B7C9', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                        Quantity: {item.quantity} · Line Total: {formatOrderCurrency(item.line_total_cents)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2.5rem' }}>
          {[
            { icon: Package, label: 'Payment Verification', status: paymentStatusLabel, color: '#B59241' },
            { icon: Truck, label: 'Dispatched', status: fulfillmentStatusLabel, color: '#3A5673' },
            { icon: CheckCircle, label: 'Delivered', status: confirmedOrder?.fulfillment_status === 'delivered' ? 'Done' : 'Pending', color: '#3A5673' },
          ].map(({ icon: Icon, label, status, color }) => (
            <div key={label} style={{ padding: '1.25rem', background: '#163250', border: `1px solid ${color}30`, borderRadius: 12 }}>
              <Icon size={24} color={color} style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem', fontWeight: 600, color: color === '#3A5673' ? '#58708A' : '#EAF0F8' }}>{label}</div>
              <div style={{ fontSize: '0.72rem', color: color === '#B59241' ? '#B59241' : '#3A5673', marginTop: 2 }}>{status}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <Link href={`/track-order?order=${encodeURIComponent(orderNum)}`} className="btn btn-primary">Track Your Order</Link>
          <Link href="/shop" className="btn btn-outline">Continue Shopping</Link>
        </div>
        <a href={buildWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp" style={{ display: 'inline-flex' }}>
          <MessageCircle size={16} /> Questions? Chat on WhatsApp
        </a>
      </div>
    </div>
  );
}
