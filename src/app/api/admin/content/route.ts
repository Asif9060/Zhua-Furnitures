import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import { normalizeContentBlockPayload } from '@/lib/media';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/types/supabase';

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

export async function GET() {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('content_blocks')
    .select('id, title, route, status, updated_at, payload')
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const blocks = (data ?? []).map((block) => mapBlockRow(block));

  return NextResponse.json({ blocks });
}

export async function POST(request: Request) {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const payload = (await request.json()) as {
    title?: string;
    route?: string;
    status?: string;
    payload?: Record<string, unknown>;
  };

  const title = String(payload.title ?? '').trim();
  const route = String(payload.route ?? '').trim();

  if (!title || !route) {
    return NextResponse.json({ error: 'Title and route are required.' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('content_blocks')
    .insert({
      title,
      route,
      status: normalizeStatus(String(payload.status ?? 'draft')),
      payload: normalizeContentBlockPayload(payload.payload) as unknown as Json,
    })
    .select('id, title, route, status, updated_at, payload')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not create content block.' }, { status: 500 });
  }

  return NextResponse.json(
    {
      block: mapBlockRow(data),
    },
    { status: 201 }
  );
}
