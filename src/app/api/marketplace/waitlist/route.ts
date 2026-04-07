import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasPublicSupabaseEnv, hasServiceSupabaseEnv } from '@/lib/supabase/env';

export const dynamic = 'force-dynamic';

type VendorWaitlistPayload = {
  businessName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  category?: string;
  message?: string;
};

export async function POST(request: Request) {
  if (!hasServiceSupabaseEnv) {
    return NextResponse.json({ error: 'Supabase service role key is missing.' }, { status: 503 });
  }

  const payload = (await request.json()) as VendorWaitlistPayload;

  const businessName = String(payload.businessName ?? '').trim();
  const contactName = String(payload.contactName ?? '').trim();
  const email = String(payload.email ?? '').trim().toLowerCase();
  const phone = String(payload.phone ?? '').trim();
  const website = String(payload.website ?? '').trim();
  const category = String(payload.category ?? '').trim() || 'General';
  const message = String(payload.message ?? '').trim();

  if (!businessName || !contactName || !email) {
    return NextResponse.json(
      { error: 'Business name, contact name, and email are required.' },
      { status: 400 }
    );
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
    .from('marketplace_vendor_applications')
    .insert({
      user_id: userId,
      business_name: businessName,
      contact_name: contactName,
      email,
      phone,
      website: website || null,
      category,
      message,
      status: 'new',
    })
    .select('id')
    .single();

  if (error || !data?.id) {
    return NextResponse.json(
      { error: error?.message ?? 'Could not submit vendor application.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, id: data.id });
}
