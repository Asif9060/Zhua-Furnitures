import { NextResponse } from 'next/server';
import { hasServiceSupabaseEnv } from '@/lib/supabase/env';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { normalizeCloudinaryImageAsset } from '@/lib/media';
import { testimonials as fallbackTestimonials } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!hasServiceSupabaseEnv) {
    const fallback = fallbackTestimonials.map((item) => ({
      id: String(item.id),
      title: item.project,
      location: item.location,
      project: item.project,
      beforeImage: null,
      afterImage: null,
    }));

    return NextResponse.json({ items: fallback });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('gallery_items')
    .select('id, title, location, project, before_image, after_image')
    .eq('status', 'published')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    location: item.location,
    project: item.project,
    beforeImage: normalizeCloudinaryImageAsset(item.before_image),
    afterImage: normalizeCloudinaryImageAsset(item.after_image),
  }));

  return NextResponse.json({ items });
}
