import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type VendorStatus = 'new' | 'reviewing' | 'approved' | 'rejected' | 'archived';

function parseVendorStatus(value: string): VendorStatus {
  const normalized = value.trim().toLowerCase();
  if (
    normalized === 'new' ||
    normalized === 'reviewing' ||
    normalized === 'approved' ||
    normalized === 'rejected' ||
    normalized === 'archived'
  ) {
    return normalized;
  }

  return 'new';
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

  const nextStatus = parseVendorStatus(String(payload.status ?? 'new'));

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('marketplace_vendor_applications')
    .update({
      status: nextStatus,
      reviewed_by: access.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(
      'id, user_id, business_name, contact_name, email, phone, website, category, message, status, reviewed_by, reviewed_at, created_at, updated_at'
    )
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Could not update vendor application.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    application: {
      id: data.id,
      userId: data.user_id,
      businessName: data.business_name,
      contactName: data.contact_name,
      email: data.email,
      phone: data.phone,
      website: data.website,
      category: data.category,
      message: data.message,
      status: data.status,
      reviewedBy: data.reviewed_by,
      reviewedAt: data.reviewed_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  });
}
