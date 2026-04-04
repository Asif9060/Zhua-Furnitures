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

function mapTestimonialRow(row: {
  id: string;
  name: string;
  location: string;
  rating: number;
  text: string;
  project: string;
  avatar_image: unknown;
  before_image: unknown;
  after_image: unknown;
  status: 'published' | 'draft';
  display_order: number;
  updated_at: string;
}) {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    rating: row.rating,
    text: row.text,
    project: row.project,
    avatarImage: normalizeCloudinaryImageAsset(row.avatar_image),
    beforeImage: normalizeCloudinaryImageAsset(row.before_image),
    afterImage: normalizeCloudinaryImageAsset(row.after_image),
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
    name?: string;
    location?: string;
    rating?: number;
    text?: string;
    project?: string;
    status?: string;
    displayOrder?: number;
    avatarImage?: unknown;
    beforeImage?: unknown;
    afterImage?: unknown;
  };

  const supabase = createSupabaseAdminClient();

  const { data: existing, error: existingError } = await supabase
    .from('testimonials')
    .select('avatar_image, before_image, after_image')
    .eq('id', id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: 'Testimonial not found.' }, { status: 404 });
  }

  try {
    if (payload.avatarImage !== undefined) {
      await maybeDeleteReplacedImage(existing.avatar_image, payload.avatarImage);
    }

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
    name?: string;
    location?: string;
    rating?: number;
    text?: string;
    project?: string;
    status?: 'published' | 'draft';
    display_order?: number;
    avatar_image?: Json | null;
    before_image?: Json | null;
    after_image?: Json | null;
  } = {};

  if (typeof payload.name === 'string' && payload.name.trim()) {
    updateData.name = payload.name.trim();
  }

  if (typeof payload.location === 'string') {
    updateData.location = payload.location.trim();
  }

  if (typeof payload.text === 'string' && payload.text.trim()) {
    updateData.text = payload.text.trim();
  }

  if (typeof payload.project === 'string') {
    updateData.project = payload.project.trim();
  }

  if (typeof payload.rating === 'number' && Number.isFinite(payload.rating)) {
    updateData.rating = Math.min(5, Math.max(1, Math.round(payload.rating)));
  }

  if (typeof payload.status === 'string') {
    updateData.status = toApiStatus(payload.status);
  }

  if (typeof payload.displayOrder === 'number' && Number.isFinite(payload.displayOrder)) {
    updateData.display_order = Math.max(0, Math.round(payload.displayOrder));
  }

  if (payload.avatarImage !== undefined) {
    const avatarImage = normalizeCloudinaryImageAsset(payload.avatarImage);
    updateData.avatar_image = avatarImage ? (avatarImage as unknown as Json) : null;
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
    .from('testimonials')
    .update(updateData)
    .eq('id', id)
    .select('id, name, location, rating, text, project, avatar_image, before_image, after_image, status, display_order, updated_at')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not update testimonial.' }, { status: 500 });
  }

  return NextResponse.json({ testimonial: mapTestimonialRow(data) });
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
    .from('testimonials')
    .select('avatar_image, before_image, after_image')
    .eq('id', id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: 'Testimonial not found.' }, { status: 404 });
  }

  const avatarImage = normalizeCloudinaryImageAsset(existing.avatar_image);
  const beforeImage = normalizeCloudinaryImageAsset(existing.before_image);
  const afterImage = normalizeCloudinaryImageAsset(existing.after_image);

  try {
    const deletions = await Promise.allSettled(
      [avatarImage?.publicId, beforeImage?.publicId, afterImage?.publicId]
        .filter((value): value is string => Boolean(value))
        .map((publicId) => destroyCloudinaryImage(publicId))
    );

    const failed = deletions.filter((entry) => entry.status === 'rejected');
    if (failed.length > 0) {
      return NextResponse.json(
        { error: 'Could not delete one or more Cloudinary assets. Testimonial was not removed.' },
        { status: 500 }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not clean up Cloudinary assets.';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { error } = await supabase.from('testimonials').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
