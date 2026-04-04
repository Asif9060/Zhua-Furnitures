import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function inferSegment(totalSpent: number, orderCount: number): 'VIP' | 'Repeat' | 'New' {
  if (totalSpent >= 50000 || orderCount >= 6) {
    return 'VIP';
  }

  if (orderCount >= 2) {
    return 'Repeat';
  }

  return 'New';
}

export async function GET() {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('orders')
    .select('customer_name, customer_email, total_cents, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const map = new Map<
    string,
    {
      id: string;
      name: string;
      email: string;
      totalSpent: number;
      orders: number;
      lastOrder: string;
    }
  >();

  (data ?? []).forEach((order, index) => {
    const key = order.customer_email.toLowerCase();
    const existing = map.get(key);

    if (existing) {
      existing.orders += 1;
      existing.totalSpent += Math.round(order.total_cents / 100);
      if (order.created_at > existing.lastOrder) {
        existing.lastOrder = order.created_at;
      }
      return;
    }

    map.set(key, {
      id: `C-${String(index + 1).padStart(4, '0')}`,
      name: order.customer_name,
      email: order.customer_email,
      totalSpent: Math.round(order.total_cents / 100),
      orders: 1,
      lastOrder: order.created_at,
    });
  });

  const customers = [...map.values()].map((customer) => ({
    ...customer,
    segment: inferSegment(customer.totalSpent, customer.orders),
    lastOrder: customer.lastOrder.slice(0, 10),
  }));

  return NextResponse.json({ customers });
}
