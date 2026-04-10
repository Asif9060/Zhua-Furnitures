import Link from 'next/link';
import { requireAuthenticatedPage } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasPublicSupabaseEnv, hasServiceSupabaseEnv } from '@/lib/supabase/env';
import { linkGuestOrdersToUserByEmail } from '@/lib/order-linking';

interface AccountOrder {
  id: string;
  orderNumber: string;
  date: string;
  total: string;
  status: string;
  payment: string;
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

export default async function OrdersPage() {
  const user = await requireAuthenticatedPage('/auth/login');
  let orders: AccountOrder[] = [];

  if (hasServiceSupabaseEnv && user.email) {
    const adminClient = createSupabaseAdminClient();
    await linkGuestOrdersToUserByEmail(adminClient, user.id, user.email);
  }

  if (hasPublicSupabaseEnv) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, created_at, total_cents, fulfillment_status, payment_status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    orders = (data ?? []).map((entry) => ({
      id: entry.id,
      orderNumber: entry.order_number,
      date: new Date(entry.created_at).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      total: formatOrderCurrency(entry.total_cents),
      status: toTitleLabel(entry.fulfillment_status),
      payment: toTitleLabel(entry.payment_status),
    }));
  }

  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        <span className="label-accent">Account</span>
        <h1 className="heading-xl" style={{ color: '#EAF0F8', margin: '1rem 0 1.25rem' }}>Order History</h1>

        {orders.length === 0 ? (
          <div style={{ background: '#163250', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1.2rem' }}>
            <p style={{ color: '#A9B7C9', marginBottom: '0.8rem' }}>No orders found for this account yet.</p>
            <Link href="/shop" className="btn btn-primary btn-sm">Browse Shop</Link>
          </div>
        ) : (
          <div style={{ background: '#163250', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr', gap: '0.6rem', padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#B59241', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <span>Order</span><span>Date</span><span>Total</span><span>Status</span><span>Payment</span>
            </div>
            {orders.map((order) => (
              <div key={order.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr', gap: '0.6rem', padding: '0.95rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <Link href={`/account/orders/${order.id}`} style={{ color: '#EAF0F8', textDecoration: 'none' }}>
                  {order.orderNumber}
                </Link>
                <span style={{ color: '#A9B7C9' }}>{order.date}</span>
                <span style={{ color: '#EAF0F8' }}>{order.total}</span>
                <span style={{ color: order.status === 'Delivered' ? '#4ECDC4' : '#B59241' }}>{order.status}</span>
                <span style={{ color: '#A9B7C9' }}>{order.payment}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
