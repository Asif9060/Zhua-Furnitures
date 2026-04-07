import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasPublicSupabaseEnv, hasServiceSupabaseEnv } from '@/lib/supabase/env';

export const dynamic = 'force-dynamic';

type ContactPayload = {
  fullName?: string;
  email?: string;
  phone?: string;
  message?: string;
};

export async function POST(request: Request) {
  if (!hasServiceSupabaseEnv) {
    return NextResponse.json({ error: 'Supabase service role key is missing.' }, { status: 503 });
  }

  const payload = (await request.json()) as ContactPayload;
  const fullName = String(payload.fullName ?? '').trim();
  const email = String(payload.email ?? '').trim().toLowerCase();
  const phone = String(payload.phone ?? '').trim();
  const message = String(payload.message ?? '').trim();

  if (!fullName || !email || !message) {
    return NextResponse.json({ error: 'Full name, email, and message are required.' }, { status: 400 });
  }

  if (!email.includes('@')) {
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
  const { data, error } = await supabase
    .from('contact_enquiries')
    .insert({
      user_id: userId,
      full_name: fullName,
      email,
      phone,
      message,
      source: 'website',
      status: 'new',
    })
    .select('id')
    .single();

  if (error || !data?.id) {
    return NextResponse.json({ error: error?.message ?? 'Could not submit enquiry.' }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, success: true });
}
