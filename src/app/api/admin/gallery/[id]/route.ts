import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import { destroyCloudinaryImage } from '@/lib/cloudinary';
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

async function maybeDeleteReplacedImage(oldValue: unknown, nextValue: unknown) {
  const current = normalizeCloudinaryImageAsset(oldValue);
  const next = normalizeCloudinaryImageAsset(nextValue);

  if (!current) {
    return;
  }

  if (!next || next.publicId !== current.publicId) {
    await destroyCloudinaryImage(current.publicId);
  }
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
    location?: string;
    project?: string;
    status?: string;
    displayOrder?: number;
    beforeImage?: unknown;
    afterImage?: unknown;
  };

  const supabase = createSupabaseAdminClient();

  const { data: existing, error: existingError } = await supabase
    .from('gallery_items')
    .select('before_image, after_image')
    .eq('id', id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: 'Gallery item not found.' }, { status: 404 });
  }

  try {
    if (payload.beforeImage !== undefined) {
      await maybeDeleteReplacedImage(existing.before_image, payload.beforeImage);
    }

    if (payload.afterImage !== undefined) {
      await maybeDeleteReplacedImage(existing.after_image, payload.afterImage);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not delete replaced Cloudinary image.';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const updateData: {
    title?: string;
    location?: string;
    project?: string;
    status?: 'published' | 'draft';
    display_order?: number;
    before_image?: Json | null;
    after_image?: Json | null;
  } = {};

  if (typeof payload.title === 'string' && payload.title.trim()) {
    updateData.title = payload.title.trim();
  }

  if (typeof payload.location === 'string') {
    updateData.location = payload.location.trim();
  }

  if (typeof payload.project === 'string') {
    updateData.project = payload.project.trim();
  }

  if (typeof payload.status === 'string') {
    updateData.status = toApiStatus(payload.status);
  }

  if (typeof payload.displayOrder === 'number' && Number.isFinite(payload.displayOrder)) {
    updateData.display_order = Math.max(0, Math.round(payload.displayOrder));
  }

  if (payload.beforeImage !== undefined) {
    const beforeImage = normalizeCloudinaryImageAsset(payload.beforeImage);
    updateData.before_image = beforeImage ? (beforeImage as unknown as Json) : null;
  }

  if (payload.afterImage !== undefined) {
    const afterImage = normalizeCloudinaryImageAsset(payload.afterImage);
    updateData.after_image = afterImage ? (afterImage as unknown as Json) : null;
  }

  const { data, error } = await supabase
    .from('gallery_items')
    .update(updateData)
    .eq('id', id)
    .select('id, title, location, project, before_image, after_image, status, display_order, updated_at')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not update gallery item.' }, { status: 500 });
  }

  return NextResponse.json({ item: mapGalleryRow(data) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: existing, error: existingError } = await supabase
    .from('gallery_items')
    .select('before_image, after_image')
    .eq('id', id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: 'Gallery item not found.' }, { status: 404 });
  }

  const beforeImage = normalizeCloudinaryImageAsset(existing.before_image);
  const afterImage = normalizeCloudinaryImageAsset(existing.after_image);

  try {
    const deletions = await Promise.allSettled(
      [beforeImage?.publicId, afterImage?.publicId]
        .filter((value): value is string => Boolean(value))
        .map((publicId) => destroyCloudinaryImage(publicId))
    );

    const failed = deletions.filter((entry) => entry.status === 'rejected');
    if (failed.length > 0) {
      return NextResponse.json(
        { error: 'Could not delete one or more Cloudinary assets. Gallery item was not removed.' },
        { status: 500 }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not clean up Cloudinary assets.';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { error } = await supabase.from('gallery_items').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
