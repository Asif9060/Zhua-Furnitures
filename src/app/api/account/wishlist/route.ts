import { NextResponse } from 'next/server';
import { getOptionalUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasPublicSupabaseEnv } from '@/lib/supabase/env';
import { logUserActivity } from '@/lib/user-activity';

export const dynamic = 'force-dynamic';

type WishlistMode = 'toggle' | 'add' | 'remove';

function normalizeMode(value: unknown): WishlistMode {
  if (value === 'add' || value === 'remove' || value === 'toggle') {
    return value;
  }

  return 'toggle';
}

async function fetchWishlistIds(userId: string): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('user_wishlist')
    .select('product_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return (data ?? []).map((row) => row.product_id);
}

export async function GET() {
  if (!hasPublicSupabaseEnv) {
    return NextResponse.json({ error: 'Supabase environment variables are missing.' }, { status: 503 });
  }

  const user = await getOptionalUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const ids = await fetchWishlistIds(user.id);
  return NextResponse.json({ ids });
}

export async function POST(request: Request) {
  if (!hasPublicSupabaseEnv) {
    return NextResponse.json({ error: 'Supabase environment variables are missing.' }, { status: 503 });
  }

  const user = await getOptionalUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const payload = (await request.json()) as {
    productId?: string;
    mode?: WishlistMode;
  };

  const productId = String(payload.productId ?? '').trim();
  const mode = normalizeMode(payload.mode);

  if (!productId) {
    return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from('user_wishlist')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle();

  const shouldAdd = mode === 'add' || (mode === 'toggle' && !existing);
  const shouldRemove = mode === 'remove' || (mode === 'toggle' && Boolean(existing));

  if (shouldAdd) {
    const { error } = await supabase
      .from('user_wishlist')
      .upsert(
        {
          user_id: user.id,
          product_id: productId,
        },
        { onConflict: 'user_id,product_id' }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logUserActivity({
      userId: user.id,
      actionType: 'wishlist_added',
      resourceType: 'wishlist',
      resourceId: productId,
    });
  }

  if (shouldRemove) {
    const { error } = await supabase
      .from('user_wishlist')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logUserActivity({
      userId: user.id,
      actionType: 'wishlist_removed',
      resourceType: 'wishlist',
      resourceId: productId,
    });
  }

  const ids = await fetchWishlistIds(user.id);
  return NextResponse.json({ ids });
}
