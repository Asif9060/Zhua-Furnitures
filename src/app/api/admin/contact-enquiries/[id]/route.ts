import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type ContactStatus = 'new' | 'in_progress' | 'resolved' | 'archived';

function parseContactStatus(value: string): ContactStatus {
  const normalized = value.trim().toLowerCase();
  if (
    normalized === 'new' ||
    normalized === 'in_progress' ||
    normalized === 'resolved' ||
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

  const nextStatus = parseContactStatus(String(payload.status ?? 'new'));

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('contact_enquiries')
    .update({ status: nextStatus })
    .eq('id', id)
    .select('id, user_id, full_name, email, phone, message, source, status, created_at, updated_at')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not update enquiry.' }, { status: 500 });
  }

  return NextResponse.json({
    enquiry: {
      id: data.id,
      userId: data.user_id,
      fullName: data.full_name,
      email: data.email,
      phone: data.phone,
      message: data.message,
      source: data.source,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  });
}
