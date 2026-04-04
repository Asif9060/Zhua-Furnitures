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

export async function GET() {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('testimonials')
    .select('id, name, location, rating, text, project, avatar_image, before_image, after_image, status, display_order, updated_at')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    testimonials: (data ?? []).map((row) => mapTestimonialRow(row)),
  });
}

export async function POST(request: Request) {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

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

  const name = String(payload.name ?? '').trim();
  const text = String(payload.text ?? '').trim();
  if (!name || !text) {
    return NextResponse.json({ error: 'Name and testimonial text are required.' }, { status: 400 });
  }

  const avatarImage = normalizeCloudinaryImageAsset(payload.avatarImage);
  const beforeImage = normalizeCloudinaryImageAsset(payload.beforeImage);
  const afterImage = normalizeCloudinaryImageAsset(payload.afterImage);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('testimonials')
    .insert({
      name,
      location: String(payload.location ?? '').trim(),
      rating:
        typeof payload.rating === 'number' && Number.isFinite(payload.rating)
          ? Math.min(5, Math.max(1, Math.round(payload.rating)))
          : 5,
      text,
      project: String(payload.project ?? '').trim(),
      status: toApiStatus(String(payload.status ?? 'published')),
      display_order:
        typeof payload.displayOrder === 'number' && Number.isFinite(payload.displayOrder)
          ? Math.max(0, Math.round(payload.displayOrder))
          : 0,
      avatar_image: avatarImage ? (avatarImage as unknown as Json) : null,
      before_image: beforeImage ? (beforeImage as unknown as Json) : null,
      after_image: afterImage ? (afterImage as unknown as Json) : null,
    })
    .select('id, name, location, rating, text, project, avatar_image, before_image, after_image, status, display_order, updated_at')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not create testimonial.' }, { status: 500 });
  }

  return NextResponse.json({ testimonial: mapTestimonialRow(data) }, { status: 201 });
}
