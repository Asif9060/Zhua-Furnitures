'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getSiteUrl } from '@/lib/supabase/site-url';
import { hasPublicSupabaseEnv, hasServiceSupabaseEnv } from '@/lib/supabase/env';
import { logUserActivity } from '@/lib/user-activity';

export interface UserRegisterState {
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

export async function registerUser(
  _prevState: UserRegisterState,
  formData: FormData
): Promise<UserRegisterState> {
  if (!hasPublicSupabaseEnv) {
    return {
      error: 'Supabase environment variables are missing. Add them in .env.local first.',
    };
  }

  const fullName = String(formData.get('fullName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');
  const redirectToRaw = String(formData.get('redirectTo') ?? '/account');
  const redirectTo = sanitizeRedirectTo(redirectToRaw);

  if (!fullName || !email || !password || !confirmPassword) {
    return {
      error: 'All fields are required.',
    };
  }

  if (fullName.length < 2) {
    return {
      error: 'Name must be at least 2 characters long.',
    };
  }

  if (password.length < 8) {
    return {
      error: 'Password must be at least 8 characters long.',
    };
  }

  if (password !== confirmPassword) {
    return {
      error: 'Passwords do not match.',
    };
  }

  const headerStore = await headers();
  const siteUrl = getSiteUrl(headerStore);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/login?registered=1&redirectTo=${encodeURIComponent(redirectTo)}`,
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  if (hasServiceSupabaseEnv && data.user) {
    const supabaseAdmin = createSupabaseAdminClient();
    await supabaseAdmin.from('profiles').upsert(
      {
        id: data.user.id,
        full_name: fullName,
        role: 'customer',
      },
      { onConflict: 'id' }
    );

    await supabaseAdmin.from('user_preferences').upsert(
      {
        user_id: data.user.id,
        marketing_email: true,
        sms_notifications: false,
      },
      { onConflict: 'user_id' }
    );

    await logUserActivity({
      userId: data.user.id,
      actionType: 'profile_updated',
      resourceType: 'profile',
      resourceId: data.user.id,
      metadata: {
        source: 'register',
      },
    });
  }

  if (data.session) {
    if (data.user) {
      await logUserActivity({
        userId: data.user.id,
        actionType: 'login',
        resourceType: 'auth',
        resourceId: data.user.id,
        metadata: {
          source: 'register',
        },
      });
    }

    redirect(redirectTo);
  }

  redirect(`/auth/login?registered=1&redirectTo=${encodeURIComponent(redirectTo)}`);
}
