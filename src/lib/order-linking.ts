import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

const MAX_AUTH_USER_PAGES = 25;
const AUTH_USERS_PER_PAGE = 200;

export function normalizeEmail(value: string | null | undefined): string {
  return String(value ?? '').trim().toLowerCase();
}

export function normalizePhone(value: string | null | undefined): string {
  return String(value ?? '').replace(/\D/g, '');
}

export async function findAuthUserIdByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<string | null> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  for (let page = 1; page <= MAX_AUTH_USER_PAGES; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: AUTH_USERS_PER_PAGE,
    });

    if (error) {
      console.error('[Order Linking] Failed to list auth users while resolving email.', {
        page,
        error: error.message,
      });
      return null;
    }

    const users = data?.users ?? [];
    const match = users.find((user) => normalizeEmail(user.email) === normalizedEmail);
    if (match?.id) {
      return match.id;
    }

    if (users.length < AUTH_USERS_PER_PAGE) {
      break;
    }
  }

  return null;
}

export async function linkGuestOrdersToUserByEmail(
  supabase: SupabaseClient,
  userId: string,
  email: string
): Promise<number> {
  const normalizedEmail = normalizeEmail(email);
  if (!userId || !normalizedEmail) {
    return 0;
  }

  const { data, error } = await supabase
    .from('orders')
    .select('id, customer_email')
    .is('user_id', null)
    .ilike('customer_email', normalizedEmail);

  if (error) {
    console.error('[Order Linking] Failed to fetch guest orders for linking.', {
      userId,
      error: error.message,
    });
    return 0;
  }

  if (!data || data.length === 0) {
    return 0;
  }

  const exactMatchIds = data
    .filter((entry) => normalizeEmail(entry.customer_email) === normalizedEmail)
    .map((entry) => entry.id);

  if (exactMatchIds.length === 0) {
    console.info('[Order Linking] Guest orders found but none matched email normalization.', {
      userId,
      scannedOrders: data.length,
    });
    return 0;
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({ user_id: userId })
    .in('id', exactMatchIds)
    .is('user_id', null);

  if (updateError) {
    console.error('[Order Linking] Failed to update guest orders to authenticated user.', {
      userId,
      matchedOrderCount: exactMatchIds.length,
      error: updateError.message,
    });
    return 0;
  }

  return exactMatchIds.length;
}
