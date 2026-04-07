import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('installation_bookings')
    .select(
      'id, user_id, product_id, product_name, address, preferred_date, preferred_slot, customer_name, customer_email, customer_phone, notes, status, created_at, updated_at'
    )
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const bookings = (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    productName: row.product_name,
    address: row.address,
    preferredDate: row.preferred_date,
    preferredSlot: row.preferred_slot,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return NextResponse.json({ bookings });
}
