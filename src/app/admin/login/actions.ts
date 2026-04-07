'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasPublicSupabaseEnv } from '@/lib/supabase/env';
import { isUserAdmin } from '@/lib/auth';
import { appendToastToPath } from '@/lib/toast-query';

export interface LoginState {
  error?: string;
}

export async function loginAdmin(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  if (!hasPublicSupabaseEnv) {
    return {
      error: 'Supabase environment variables are missing. Add them in .env.local first.',
    };
  }

  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const redirectToRaw = String(formData.get('redirectTo') ?? '/admin');
  const redirectTo = redirectToRaw.trim().startsWith('/admin') ? redirectToRaw.trim() : '/admin';

  if (!email || !password) {
    return {
      error: 'Email and password are required.',
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      error: error.message,
    };
  }

  const user = data.user;
  if (!user) {
    return {
      error: 'Could not verify the signed-in account.',
    };
  }

  const admin = await isUserAdmin(user.id, user.email ?? null);
  if (!admin) {
    await supabase.auth.signOut();
    return {
      error: 'This account is not authorized for admin access.',
    };
  }

  redirect(appendToastToPath(redirectTo, 'success', 'Admin login successful.'));
}
