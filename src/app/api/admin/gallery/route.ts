import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import { normalizeCloudinaryImageAsset } from '@/lib/media';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/types/supabase';

export const dynamic = 'force-dynamic';

function toApiStatus(value: string): 'published' | 'draft' {
  return value.trim().toLowerCase() === 'published' ? 'published' : 'draft';
}

function toDisplayStatus(value: 'published' | 'draft'): 'Published' | 'Draft' {
  return value === 'published' ? 'Published' : 'Draft';
}

function mapGalleryRow(row: {
  id: string;
  title: string;
  location: string;
  project: string;
  before_image: unknown;
  after_image: unknown;
  status: 'published' | 'draft';
  display_order: number;
  updated_at: string;
}) {
  const beforeImage = normalizeCloudinaryImageAsset(row.before_image);
  const afterImage = normalizeCloudinaryImageAsset(row.after_image);

  return {
    id: row.id,
    title: row.title,
    location: row.location,
    project: row.project,
    beforeImage,
    afterImage,
    status: toDisplayStatus(row.status),
    displayOrder: row.display_order,
    updatedAt: row.updated_at.replace('T', ' ').slice(0, 16),
  };
}

export async function GET() {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('gallery_items')
    .select('id, title, location, project, before_image, after_image, status, display_order, updated_at')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    items: (data ?? []).map((row) => mapGalleryRow(row)),
  });
}

export async function POST(request: Request) {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const payload = (await request.json()) as {
    title?: string;
    location?: string;
    project?: string;
    status?: string;
    displayOrder?: number;
    beforeImage?: unknown;
    afterImage?: unknown;
  };

  const title = String(payload.title ?? '').trim();
  if (!title) {
    return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
  }

  const beforeImage = normalizeCloudinaryImageAsset(payload.beforeImage);
  const afterImage = normalizeCloudinaryImageAsset(payload.afterImage);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('gallery_items')
    .insert({
      title,
      location: String(payload.location ?? '').trim(),
      project: String(payload.project ?? '').trim(),
      status: toApiStatus(String(payload.status ?? 'draft')),
      display_order: Number.isFinite(payload.displayOrder)
        ? Math.max(0, Math.round(payload.displayOrder ?? 0))
        : 0,
      before_image: beforeImage ? (beforeImage as unknown as Json) : null,
      after_image: afterImage ? (afterImage as unknown as Json) : null,
    })
    .select('id, title, location, project, before_image, after_image, status, display_order, updated_at')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not create gallery item.' }, { status: 500 });
  }

  return NextResponse.json({ item: mapGalleryRow(data) }, { status: 201 });
}
