import { NextResponse } from 'next/server';
import { getOptionalUser, isUserAdmin } from '@/lib/auth';
import { hasPublicSupabaseEnv, hasServiceSupabaseEnv } from '@/lib/supabase/env';

export async function ensureAdminApiAccess(): Promise<
  | { userId: string; email: string | null }
  | NextResponse<{ error: string }>
> {
  if (!hasPublicSupabaseEnv || !hasServiceSupabaseEnv) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });
  }

  const user = await getOptionalUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const admin = await isUserAdmin(user.id, user.email);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  return {
    userId: user.id,
    email: user.email,
  };
}
