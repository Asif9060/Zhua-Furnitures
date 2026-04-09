'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasPublicSupabaseEnv } from '@/lib/supabase/env';
import { appendToastToPath } from '@/lib/toast-query';

export async function signOutAdmin() {
  if (!hasPublicSupabaseEnv) {
    redirect(appendToastToPath('/auth/login', 'info', 'Signed out successfully.'));
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(appendToastToPath('/auth/login', 'info', 'Signed out successfully.'));
}
