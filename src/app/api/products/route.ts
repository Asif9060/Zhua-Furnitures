import { NextResponse } from 'next/server';
import { products as fallbackProducts } from '@/lib/data';
import { normalizeCloudinaryImageAssets } from '@/lib/media';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hasServiceSupabaseEnv } from '@/lib/supabase/env';

export const dynamic = 'force-dynamic';

function isRenderableImageUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https:\/\//i.test(value.trim());
}

function toSafeColors(value: unknown): { name: string; hex: string }[] {
  if (!Array.isArray(value)) {
    return [{ name: 'Default', hex: '#B59241' }];
  }

  const colors = value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const item = entry as Record<string, unknown>;
      const name = typeof item.name === 'string' ? item.name.trim() : '';
      const hex = typeof item.hex === 'string' ? item.hex.trim() : '';

      if (!name || !hex) {
        return null;
      }

      return { name, hex };
    })
    .filter((entry): entry is { name: string; hex: string } => entry !== null);

  return colors.length > 0 ? colors : [{ name: 'Default', hex: '#B59241' }];
}

function toImageUrls(value: unknown): string[] {
  const cloudinary = normalizeCloudinaryImageAssets(value)
    .map((asset) => asset.secureUrl)
    .filter((url) => isRenderableImageUrl(url));

  if (cloudinary.length > 0) {
    return cloudinary;
  }

  if (Array.isArray(value)) {
    return value.filter((entry) => isRenderableImageUrl(entry));
  }

  return [];
}

export async function GET() {
  if (!hasServiceSupabaseEnv) {
    const products = fallbackProducts.map((product) => ({
      ...product,
      images: product.images.filter((url) => isRenderableImageUrl(url)),
      weightKg: Number(product.weightKg ?? 0),
      dimensions: {
        widthCm: Number(product.dimensions?.widthCm ?? 0),
        depthCm: Number(product.dimensions?.depthCm ?? 0),
        heightCm: Number(product.dimensions?.heightCm ?? 0),
      },
    }));

    return NextResponse.json({ products });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, slug, name, category, subcategory, price_cents, original_price_cents, rating, review_count, badge, description, long_description, images, colors, sizes, fabrics, in_stock, is_customizable, delivery_days, weight_kg, width_cm, depth_cm, height_cm, features')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const products = (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    subcategory: row.subcategory,
    price: Math.round(row.price_cents / 100),
    originalPrice:
      typeof row.original_price_cents === 'number'
        ? Math.round(row.original_price_cents / 100)
        : undefined,
    rating: Number(row.rating ?? 5),
    reviewCount: row.review_count,
    badge: row.badge ?? undefined,
    description: row.description,
    longDescription: row.long_description,
    images: toImageUrls(row.images),
    colors: toSafeColors(row.colors),
    sizes: row.sizes ?? [],
    fabrics: row.fabrics ?? [],
    inStock: row.in_stock,
    isCustomizable: row.is_customizable,
    deliveryDays: row.delivery_days,
    weightKg: Number(row.weight_kg ?? 0),
    dimensions: {
      widthCm: Number(row.width_cm ?? 0),
      depthCm: Number(row.depth_cm ?? 0),
      heightCm: Number(row.height_cm ?? 0),
    },
    features: row.features ?? [],
  }));

  return NextResponse.json({ products });
}
