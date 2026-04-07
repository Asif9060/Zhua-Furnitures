import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type BookingStatus = 'pending' | 'scheduled' | 'completed' | 'cancelled';

function parseBookingStatus(value: string): BookingStatus {
  const normalized = value.trim().toLowerCase();
  if (
    normalized === 'pending' ||
    normalized === 'scheduled' ||
    normalized === 'completed' ||
    normalized === 'cancelled'
  ) {
    return normalized;
  }

  return 'pending';
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const { id } = await params;
  const payload = (await request.json()) as { status?: string };

  const nextStatus = parseBookingStatus(String(payload.status ?? 'pending'));

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('installation_bookings')
    .update({ status: nextStatus })
    .eq('id', id)
    .select(
      'id, user_id, product_id, product_name, address, preferred_date, preferred_slot, customer_name, customer_email, customer_phone, notes, status, created_at, updated_at'
    )
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not update booking.' }, { status: 500 });
  }

  return NextResponse.json({
    booking: {
      id: data.id,
      userId: data.user_id,
      productId: data.product_id,
      productName: data.product_name,
      address: data.address,
      preferredDate: data.preferred_date,
      preferredSlot: data.preferred_slot,
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      customerPhone: data.customer_phone,
      notes: data.notes,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  });
}
