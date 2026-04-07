import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAdminEmailAllowlist, hasPublicSupabaseEnv } from '@/lib/supabase/env';
import { appendToastToPath } from '@/lib/toast-query';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
}

export function isAllowlistedAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  const allowlist = getAdminEmailAllowlist();
  return allowlist.includes(email.toLowerCase());
}

export async function getOptionalUser(): Promise<AuthenticatedUser | null> {
  if (!hasPublicSupabaseEnv) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
  };
}

export async function isUserAdmin(userId: string, email: string | null): Promise<boolean> {
  if (isAllowlistedAdminEmail(email)) {
    return true;
  }

  if (!hasPublicSupabaseEnv) {
    return false;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  return data?.role === 'admin';
}

export async function requireAuthenticatedPage(loginPath: string): Promise<AuthenticatedUser> {
  const user = await getOptionalUser();

  if (!user) {
    redirect(appendToastToPath(loginPath, 'info', 'Please sign in to continue.'));
  }

  return user;
}

export async function requireAdminPage(): Promise<AuthenticatedUser | null> {
  if (!hasPublicSupabaseEnv) {
    return null;
  }

  const user = await requireAuthenticatedPage('/admin/login');
  const admin = await isUserAdmin(user.id, user.email);

  if (!admin) {
    redirect(appendToastToPath('/', 'error', 'Admin access is required for that page.'));
  }

  return user;
}
