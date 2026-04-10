import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hasServiceSupabaseEnv } from '@/lib/supabase/env';
import { getOptionalUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

type NewsletterPayload = {
  email?: string;
  source?: string;
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export async function POST(request: Request) {
  if (!hasServiceSupabaseEnv) {
    return NextResponse.json({ error: 'Supabase service role key is missing.' }, { status: 503 });
  }

  const payload = (await request.json()) as NewsletterPayload;
  const email = normalizeEmail(String(payload.email ?? ''));
  const source = String(payload.source ?? 'footer').trim() || 'footer';

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
  }

  const userId = (await getOptionalUser())?.id ?? null;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('newsletter_subscriptions').upsert(
    {
      user_id: userId,
      email,
      source,
      status: 'subscribed',
      unsubscribed_at: null,
    },
    { onConflict: 'email' }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Subscribed successfully.' });
}
