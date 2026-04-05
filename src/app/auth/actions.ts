'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasPublicSupabaseEnv } from '@/lib/supabase/env';
import { logUserActivity } from '@/lib/user-activity';

export async function signOutUser() {
  if (!hasPublicSupabaseEnv) {
    redirect('/auth/login');
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await logUserActivity({
      userId: user.id,
      actionType: 'logout',
      resourceType: 'auth',
      resourceId: user.id,
    });
  }

  await supabase.auth.signOut();
  redirect('/auth/login');
}
