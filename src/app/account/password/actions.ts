'use server';

import { requireAuthenticatedPage } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasPublicSupabaseEnv } from '@/lib/supabase/env';
import { logUserActivity } from '@/lib/user-activity';

export interface ChangePasswordState {
  error?: string;
  success?: string;
}

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  if (!hasPublicSupabaseEnv) {
    return { error: 'Supabase environment variables are missing.' };
  }

  const user = await requireAuthenticatedPage('/auth/login');
  const currentPassword = String(formData.get('currentPassword') ?? '');
  const newPassword = String(formData.get('newPassword') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'All fields are required.' };
  }

  if (newPassword.length < 8) {
    return { error: 'New password must be at least 8 characters long.' };
  }

  if (newPassword !== confirmPassword) {
    return { error: 'New password and confirmation do not match.' };
  }

  if (!user.email) {
    return { error: 'Unable to verify current password for this account.' };
  }

  const supabase = await createSupabaseServerClient();
  const { error: reAuthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (reAuthError) {
    return { error: 'Current password is incorrect.' };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { error: error.message };
  }

  await logUserActivity({
    userId: user.id,
    actionType: 'password_changed',
    resourceType: 'auth',
    resourceId: user.id,
  });

  return { success: 'Password changed successfully.' };
}
