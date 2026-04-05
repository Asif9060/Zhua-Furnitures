'use server';

import { requireAuthenticatedPage } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasPublicSupabaseEnv } from '@/lib/supabase/env';
import { logUserActivity } from '@/lib/user-activity';

export interface UpdateProfileState {
  error?: string;
  success?: string;
}

export async function updateProfile(
  _prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  if (!hasPublicSupabaseEnv) {
    return { error: 'Supabase environment variables are missing.' };
  }

  const user = await requireAuthenticatedPage('/auth/login');

  const fullName = String(formData.get('fullName') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const avatarUrl = String(formData.get('avatarUrl') ?? '').trim();
  const addressLine1 = String(formData.get('addressLine1') ?? '').trim();
  const addressLine2 = String(formData.get('addressLine2') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim();
  const province = String(formData.get('province') ?? '').trim();
  const postalCode = String(formData.get('postalCode') ?? '').trim();
  const marketingEmail = formData.get('marketingEmail') === 'on';
  const smsNotifications = formData.get('smsNotifications') === 'on';

  if (!fullName) {
    return { error: 'Full name is required.' };
  }

  const supabase = await createSupabaseServerClient();

  const addressPrimary = {
    line1: addressLine1,
    line2: addressLine2,
    city,
    province,
    postalCode,
  };

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      phone: phone || null,
      avatar_url: avatarUrl || null,
      address_primary: addressPrimary,
    })
    .eq('id', user.id);

  if (profileError) {
    return {
      error:
        profileError.message.includes('column') || profileError.message.includes('relation')
          ? 'Profile schema update is pending. Run Supabase migrations and try again.'
          : profileError.message,
    };
  }

  const { error: prefsError } = await supabase
    .from('user_preferences')
    .upsert(
      {
        user_id: user.id,
        marketing_email: marketingEmail,
        sms_notifications: smsNotifications,
      },
      { onConflict: 'user_id' }
    );

  if (prefsError) {
    return {
      error:
        prefsError.message.includes('column') || prefsError.message.includes('relation')
          ? 'Preference schema update is pending. Run Supabase migrations and try again.'
          : prefsError.message,
    };
  }

  await logUserActivity({
    userId: user.id,
    actionType: 'profile_updated',
    resourceType: 'profile',
    resourceId: user.id,
    metadata: {
      updated: ['full_name', 'phone', 'avatar_url', 'address_primary', 'marketing_email', 'sms_notifications'],
    },
  });

  return { success: 'Profile updated successfully.' };
}
