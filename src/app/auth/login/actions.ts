'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasPublicSupabaseEnv } from '@/lib/supabase/env';
import { appendToastToPath } from '@/lib/toast-query';
import { logUserActivity } from '@/lib/user-activity';

export interface UserLoginState {
  error?: string;
}

function sanitizeRedirectTo(rawValue: string, fallback = '/account'): string {
  const value = rawValue.trim();

  if (!value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }

  if (value.startsWith('/admin')) {
    return fallback;
  }

  return value;
}

export async function loginUser(
  _prevState: UserLoginState,
  formData: FormData
): Promise<UserLoginState> {
  if (!hasPublicSupabaseEnv) {
    return {
      error: 'Supabase environment variables are missing. Add them in .env.local first.',
    };
  }

  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const redirectToRaw = String(formData.get('redirectTo') ?? '/account');
  const redirectTo = sanitizeRedirectTo(redirectToRaw);

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

  if (data.user) {
    await logUserActivity({
      userId: data.user.id,
      actionType: 'login',
      resourceType: 'auth',
      resourceId: data.user.id,
    });
  }

  redirect(appendToastToPath(redirectTo, 'success', 'Signed in successfully.'));
}
