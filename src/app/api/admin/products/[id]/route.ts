import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import {
  displayCategory,
  displayProductStatus,
  parseCategory,
  parseProductStatus,
} from '@/lib/admin-api';
import { destroyCloudinaryImage } from '@/lib/cloudinary';
import { normalizeCloudinaryImageAssets } from '@/lib/media';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

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
    category?: string;
    stock?: number;
    price?: number;
    status?: string;
    images?: unknown;
  };

  const updateData: {
    name?: string;
    category?: 'furniture' | 'curtains' | 'accessories';
    stock?: number;
    in_stock?: boolean;
    price_cents?: number;
    status?: 'active' | 'draft' | 'archived';
    images?: unknown;
  } = {};

  if (typeof payload.name === 'string' && payload.name.trim()) {
    updateData.name = payload.name.trim();
  }

  if (typeof payload.category === 'string') {
    updateData.category = parseCategory(payload.category);
  }

  if (typeof payload.stock === 'number' && Number.isFinite(payload.stock)) {
    updateData.stock = Math.max(0, Math.round(payload.stock));
    updateData.in_stock = updateData.stock > 0;
  }

  if (typeof payload.price === 'number' && Number.isFinite(payload.price)) {
    updateData.price_cents = Math.max(0, Math.round(payload.price * 100));
  }

  if (typeof payload.status === 'string') {
    updateData.status = parseProductStatus(payload.status);
  }

  if (payload.images !== undefined) {
    updateData.images = normalizeCloudinaryImageAssets(payload.images);
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select('id, sku, slug, name, category, stock, price_cents, status, images')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not update product.' }, { status: 500 });
  }

  const images = normalizeCloudinaryImageAssets(data.images);

  return NextResponse.json({
    product: {
      id: data.id,
      sku: data.sku,
      slug: data.slug,
      name: data.name,
      category: displayCategory(data.category),
      stock: data.stock,
      price: Math.round(data.price_cents / 100),
      status: displayProductStatus(data.status),
      images,
      primaryImage: images[0]?.secureUrl ?? null,
      imageCount: images.length,
    },
  });
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

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('images')
    .eq('id', id)
    .maybeSingle();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  const images = normalizeCloudinaryImageAssets(product?.images);
  if (images.length > 0) {
    const deletions = await Promise.allSettled(
      images.map((asset) => destroyCloudinaryImage(asset.publicId))
    );

    const failed = deletions.filter((entry) => entry.status === 'rejected');
    if (failed.length > 0) {
      return NextResponse.json(
        { error: 'Could not delete one or more Cloudinary assets. Product was not removed.' },
        { status: 500 }
      );
    }
  }

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
