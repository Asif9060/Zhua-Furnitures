import { NextResponse } from 'next/server';
import { testimonials as fallbackTestimonials } from '@/lib/data';
import { normalizeCloudinaryImageAsset } from '@/lib/media';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hasServiceSupabaseEnv } from '@/lib/supabase/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!hasServiceSupabaseEnv) {
    return NextResponse.json({
      testimonials: fallbackTestimonials.map((item) => ({
        id: String(item.id),
        name: item.name,
        location: item.location,
        rating: item.rating,
        text: item.text,
        project: item.project,
        avatarImage: null,
        beforeImage: null,
        afterImage: null,
      })),
    });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('testimonials')
    .select('id, name, location, rating, text, project, avatar_image, before_image, after_image')
    .eq('status', 'published')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    testimonials: (data ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      location: item.location,
      rating: item.rating,
      text: item.text,
      project: item.project,
      avatarImage: normalizeCloudinaryImageAsset(item.avatar_image),
      beforeImage: normalizeCloudinaryImageAsset(item.before_image),
      afterImage: normalizeCloudinaryImageAsset(item.after_image),
    })),
  });
}
