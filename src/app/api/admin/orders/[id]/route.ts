import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import {
  displayFulfillmentStatus,
  displayPaymentStatus,
  parseFulfillmentStatus,
  parsePaymentStatus,
} from '@/lib/admin-api';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logUserActivity } from '@/lib/user-activity';

export const dynamic = 'force-dynamic';

type OrderItemRow = {
  product_name: string;
  quantity: number;
  line_total_cents: number;
  selected_color: string | null;
  selected_size: string | null;
  selected_fabric: string | null;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const { id } = await params;
  const payload = (await request.json()) as {
    fulfillment?: string;
    payment?: string;
  };

  const updateData: {
    fulfillment_status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    payment_status?: 'awaiting_payment' | 'pending' | 'paid' | 'partial' | 'failed' | 'placeholder';
  } = {};

  if (payload.fulfillment) {
    updateData.fulfillment_status = parseFulfillmentStatus(payload.fulfillment);
  }

  if (payload.payment) {
    updateData.payment_status = parsePaymentStatus(payload.payment);
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', id)
    .select(
      'id, order_number, user_id, customer_name, customer_email, created_at, total_cents, payment_status, fulfillment_status, order_items(product_name, quantity, line_total_cents, selected_color, selected_size, selected_fabric)'
    )
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not update order.' }, { status: 500 });
  }

  const orderItems = (data.order_items ?? []) as OrderItemRow[];
  const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  if (data.user_id) {
    await logUserActivity({
      userId: data.user_id,
      actionType: 'order_status_changed',
      resourceType: 'order',
      resourceId: data.id,
      metadata: {
        paymentStatus: data.payment_status,
        fulfillmentStatus: data.fulfillment_status,
      },
    });
  }

  return NextResponse.json({
    order: {
      id: data.id,
      orderNumber: data.order_number,
      customer: data.customer_name,
      customerEmail: data.customer_email,
      date: data.created_at.slice(0, 10),
      total: Math.round(data.total_cents / 100),
      items: itemCount,
      orderItems: orderItems.map((item) => ({
        productName: item.product_name,
        quantity: item.quantity,
        lineTotal: Math.round(item.line_total_cents / 100),
        selectedColor: item.selected_color,
        selectedSize: item.selected_size,
        selectedFabric: item.selected_fabric,
      })),
      payment: displayPaymentStatus(data.payment_status),
      fulfillment: displayFulfillmentStatus(data.fulfillment_status),
    },
  });
}
