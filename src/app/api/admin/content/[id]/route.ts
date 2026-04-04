import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import { normalizeContentBlockPayload } from '@/lib/media';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { Database, Json } from '@/types/supabase';

export const dynamic = 'force-dynamic';

function normalizeStatus(value: string): 'published' | 'scheduled' | 'draft' {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'published' || normalized === 'scheduled' || normalized === 'draft') {
    return normalized;
  }
  return 'draft';
}

function displayStatus(value: 'published' | 'scheduled' | 'draft'): 'Published' | 'Scheduled' | 'Draft' {
  if (value === 'published') return 'Published';
  if (value === 'scheduled') return 'Scheduled';
  return 'Draft';
}

function mapBlockRow(row: {
  id: string;
  title: string;
  route: string;
  status: 'published' | 'scheduled' | 'draft';
  updated_at: string;
  payload: unknown;
}) {
  return {
    id: row.id,
    title: row.title,
    route: row.route,
    status: displayStatus(row.status),
    updatedAt: row.updated_at.replace('T', ' ').slice(0, 16),
    payload: normalizeContentBlockPayload(row.payload),
  };
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
  const payload = (await request.json()) as {
    title?: string;
    route?: string;
    status?: string;
    payload?: Record<string, unknown>;
  };

  const updateData: Database['public']['Tables']['content_blocks']['Update'] = {};

  if (typeof payload.title === 'string' && payload.title.trim()) {
    updateData.title = payload.title.trim();
  }

  if (typeof payload.route === 'string' && payload.route.trim()) {
    updateData.route = payload.route.trim();
  }

  if (typeof payload.status === 'string') {
    updateData.status = normalizeStatus(payload.status);
  }

  if (payload.payload && typeof payload.payload === 'object') {
    updateData.payload = normalizeContentBlockPayload(payload.payload) as unknown as Json;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('content_blocks')
    .update(updateData)
    .eq('id', id)
    .select('id, title, route, status, updated_at, payload')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not update content block.' }, { status: 500 });
  }

  return NextResponse.json({
    block: mapBlockRow(data),
  });
}
