import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasPublicSupabaseEnv, hasServiceSupabaseEnv } from '@/lib/supabase/env';

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

  let userId: string | null = null;
  if (hasPublicSupabaseEnv) {
    const authClient = await createSupabaseServerClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    userId = user?.id ?? null;
  }

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
