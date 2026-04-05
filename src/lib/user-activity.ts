import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hasServiceSupabaseEnv } from '@/lib/supabase/env';

export type UserActivityActionType =
  | 'login'
  | 'logout'
  | 'order_created'
  | 'order_status_changed'
  | 'wishlist_added'
  | 'wishlist_removed'
  | 'profile_updated'
  | 'password_changed'
  | 'password_reset_requested'
  | 'product_viewed';

export type UserActivityResourceType = 'auth' | 'order' | 'wishlist' | 'profile' | 'product';

export async function logUserActivity(input: {
  userId: string;
  actionType: UserActivityActionType;
  resourceType: UserActivityResourceType;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  if (!hasServiceSupabaseEnv) {
    return;
  }

  try {
    const supabase = createSupabaseAdminClient();
    await supabase.from('user_activity_log').insert({
      user_id: input.userId,
      action_type: input.actionType,
      resource_type: input.resourceType,
      resource_id: input.resourceId ?? null,
      metadata: input.metadata ?? {},
    });
  } catch {
    // Logging must never block user-facing actions.
  }
}

export async function logProductView(input: {
  userId: string;
  productId: string;
  context?: Record<string, unknown>;
}) {
  if (!hasServiceSupabaseEnv) {
    return;
  }

  try {
    const supabase = createSupabaseAdminClient();
    await supabase.from('user_browsing_history').insert({
      user_id: input.userId,
      product_id: input.productId,
      context: input.context ?? {},
    });
  } catch {
    // Logging must never block user-facing actions.
  }

  await logUserActivity({
    userId: input.userId,
    actionType: 'product_viewed',
    resourceType: 'product',
    resourceId: input.productId,
    metadata: input.context,
  });
}
