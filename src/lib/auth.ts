import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAdminEmailAllowlist, hasPublicSupabaseEnv } from '@/lib/supabase/env';
import { appendToastToPath } from '@/lib/toast-query';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
}

type MaybeAuthError = {
  code?: string;
  message?: string;
};

function isMissingRefreshTokenError(error: MaybeAuthError | null | undefined): boolean {
  if (!error) {
    return false;
  }

  const code = String(error.code ?? '').toLowerCase();
  const message = String(error.message ?? '').toLowerCase();

  return code === 'refresh_token_not_found' || message.includes('refresh token not found');
}

async function clearSupabaseAuthCookies(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const authCookieNames = cookieStore
      .getAll()
      .map((cookie) => cookie.name)
      .filter((name) => name.startsWith('sb-') && name.includes('-auth-token'));

    authCookieNames.forEach((name) => {
      try {
        cookieStore.delete(name);
      } catch {
        // Cookie deletion is best-effort depending on runtime context.
      }
    });
  } catch {
    // Reading cookies can fail in non-request contexts.
  }
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
  let user: { id: string; email?: string | null } | null = null;
  let error: MaybeAuthError | null = null;

  try {
    const response = await supabase.auth.getUser();
    user = response.data.user;
    error = response.error;
  } catch (caughtError) {
    error = caughtError as MaybeAuthError;
  }

  if (isMissingRefreshTokenError(error)) {
    await clearSupabaseAuthCookies();
    return null;
  }

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

  const user = await requireAuthenticatedPage('/auth/login');
  const admin = await isUserAdmin(user.id, user.email);

  if (!admin) {
    redirect(appendToastToPath('/', 'error', 'Admin access is required for that page.'));
  }

  return user;
}
