import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type ProfileRow = {
  id: string;
  full_name: string | null;
  created_at: string;
};

type OrderRow = {
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  total_cents: number;
  created_at: string;
};

type CustomerStats = {
  orders: number;
  totalSpent: number;
  lastOrderIso: string;
  lastOrderName: string;
  lastOrderEmail: string;
};

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
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, created_at')
    .eq('role', 'customer')
    .order('created_at', { ascending: false });

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const profiles = (profilesData ?? []) as ProfileRow[];
  const profileIds = profiles.map((profile) => profile.id);
  const profileIdSet = new Set(profileIds);

  let orders: OrderRow[] = [];
  if (profileIds.length > 0) {
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('user_id, customer_name, customer_email, total_cents, created_at')
      .in('user_id', profileIds)
      .order('created_at', { ascending: false });

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    orders = (ordersData ?? []) as OrderRow[];
  }

  const authEmailById = new Map<string, string>();
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (!authError) {
    (authData?.users ?? []).forEach((user) => {
      if (profileIdSet.has(user.id) && user.email) {
        authEmailById.set(user.id, user.email);
      }
    });
  }

  const statsByUserId = new Map<string, CustomerStats>();

  orders.forEach((order) => {
    if (!order.user_id) {
      return;
    }

    const existing = statsByUserId.get(order.user_id);

    if (existing) {
      existing.orders += 1;
      existing.totalSpent += Math.round(order.total_cents / 100);
      if (order.created_at > existing.lastOrderIso) {
        existing.lastOrderIso = order.created_at;
        existing.lastOrderName = order.customer_name;
        existing.lastOrderEmail = order.customer_email;
      }
      return;
    }

    statsByUserId.set(order.user_id, {
      orders: 1,
      totalSpent: Math.round(order.total_cents / 100),
      lastOrderIso: order.created_at,
      lastOrderName: order.customer_name,
      lastOrderEmail: order.customer_email,
    });
  });

  const customers = profiles.map((profile, index) => {
    const stats = statsByUserId.get(profile.id);
    const totalSpent = stats?.totalSpent ?? 0;
    const ordersCount = stats?.orders ?? 0;
    const email = authEmailById.get(profile.id) ?? stats?.lastOrderEmail ?? '-';
    const fallbackName = `Customer ${String(index + 1).padStart(4, '0')}`;
    const name = profile.full_name?.trim() || stats?.lastOrderName || fallbackName;

    return {
      id: profile.id,
      name,
      email,
      totalSpent,
      orders: ordersCount,
      segment: inferSegment(totalSpent, ordersCount),
      lastOrder: stats?.lastOrderIso ? stats.lastOrderIso.slice(0, 10) : 'Never',
      joinedAt: profile.created_at,
      lastOrderIso: stats?.lastOrderIso ?? '',
    };
  });

  customers.sort((a, b) => {
    if (a.joinedAt === b.joinedAt) {
      return b.lastOrderIso.localeCompare(a.lastOrderIso);
    }

    return b.joinedAt.localeCompare(a.joinedAt);
  });

  return NextResponse.json({
    customers: customers.map(({ joinedAt, lastOrderIso, ...customer }) => customer),
  });
}
