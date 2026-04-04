import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import {
  displayCategory,
  displayProductStatus,
  parseCategory,
  parseProductStatus,
  slugify,
} from '@/lib/admin-api';
import { normalizeCloudinaryImageAssets } from '@/lib/media';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function buildSku(name: string): string {
  const base = slugify(name).toUpperCase().replace(/-/g, '').slice(0, 8);
  const token = Math.floor(Math.random() * 900 + 100);
  return `ZH-${base}-${token}`;
}

export async function GET() {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, sku, slug, name, category, stock, price_cents, status, images')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []).map((product) => {
    const images = normalizeCloudinaryImageAssets(product.images);

    return {
      id: product.id,
      sku: product.sku,
      slug: product.slug,
      name: product.name,
      category: displayCategory(product.category),
      stock: product.stock,
      price: Math.round(product.price_cents / 100),
      status: displayProductStatus(product.status),
      images,
      primaryImage: images[0]?.secureUrl ?? null,
      imageCount: images.length,
    };
  });

  return NextResponse.json({ products: rows });
}

export async function POST(request: Request) {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const payload = (await request.json()) as {
    name?: string;
    category?: string;
    price?: number;
    stock?: number;
    sku?: string;
    images?: unknown;
    description?: string;
    longDescription?: string;
  };

  const name = String(payload.name ?? '').trim();
  if (!name) {
    return NextResponse.json({ error: 'Product name is required.' }, { status: 400 });
  }

  const category = parseCategory(String(payload.category ?? 'furniture'));
  const price = Number(payload.price ?? 0);
  const stock = Number(payload.stock ?? 0);
  const slug = slugify(name);
  const description = String(payload.description ?? '').trim() || `${name} by Zhua Enterprises.`;
  const longDescription =
    String(payload.longDescription ?? '').trim() ||
    description;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('products')
    .insert({
      slug,
      name,
      category,
      subcategory: 'General',
      price_cents: Math.max(0, Math.round(price * 100)),
      sku: payload.sku?.trim() || buildSku(name),
      stock: Math.max(0, Math.round(stock)),
      status: parseProductStatus('active'),
      in_stock: stock > 0,
      description,
      long_description: longDescription,
      images: normalizeCloudinaryImageAssets(payload.images),
      colors: [],
      features: [],
      delivery_days: '7-10 business days',
    })
    .select('id, sku, slug, name, category, stock, price_cents, status, images')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not create product.' }, { status: 500 });
  }

  const images = normalizeCloudinaryImageAssets(data.images);

  return NextResponse.json(
    {
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
    },
    { status: 201 }
  );
}
