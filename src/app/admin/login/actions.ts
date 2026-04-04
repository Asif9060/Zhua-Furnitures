'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasPublicSupabaseEnv } from '@/lib/supabase/env';

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
  const redirectTo = redirectToRaw.startsWith('/admin') ? redirectToRaw : '/admin';

  if (!email || !password) {
    return {
      error: 'Email and password are required.',
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      error: error.message,
    };
  }

  redirect(redirectTo);
}
