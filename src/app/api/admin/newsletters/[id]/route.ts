import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type NewsletterStatus = 'subscribed' | 'unsubscribed';

function parseNewsletterStatus(value: string): NewsletterStatus {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'subscribed' || normalized === 'unsubscribed') {
    return normalized;
  }

  return 'subscribed';
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
  const payload = (await request.json()) as { status?: string };

  const nextStatus = parseNewsletterStatus(String(payload.status ?? 'subscribed'));

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('newsletter_subscriptions')
    .update({
      status: nextStatus,
      unsubscribed_at: nextStatus === 'unsubscribed' ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select('id, user_id, email, source, status, unsubscribed_at, created_at, updated_at')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not update subscription.' }, { status: 500 });
  }

  return NextResponse.json({
    subscription: {
      id: data.id,
      userId: data.user_id,
      email: data.email,
      source: data.source,
      status: data.status,
      unsubscribedAt: data.unsubscribed_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  });
}
