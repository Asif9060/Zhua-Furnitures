import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import { serializeCsv, type CsvRow } from '@/lib/csv';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type TransactionOrderRow = {
  id: string;
  order_number: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  city: string;
  province: string;
  delivery_type: string;
  delivery_fee_cents: number;
  total_cents: number;
  payment_method: string;
  payment_status: string;
  fulfillment_status: string;
  gateway_provider: string;
  payment_reference: string | null;
  payment_received_at: string | null;
  payment_settled_at: string | null;
  refunded_cents: number;
  remaining_balance_cents: number;
};

type TransactionOrderRelation = TransactionOrderRow | TransactionOrderRow[] | null;

type TransactionRow = {
  id: string;
  order_id: string;
  gateway: string;
  transaction_type: string;
  status: string;
  amount_cents: number;
  currency: string;
  gateway_transaction_id: string | null;
  idempotency_key: string | null;
  error_code: string | null;
  error_message: string | null;
  attempted_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  orders: TransactionOrderRelation;
};

type OrderItemRow = {
  order_id: string;
  product_name: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
  selected_color: string | null;
  selected_size: string | null;
  selected_fabric: string | null;
};

function parseIntegerParam(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return null;
  }

  return parsed;
}

function centsToAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

function normalizeOrder(value: TransactionOrderRelation): TransactionOrderRow | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function buildOrderItemsSummary(items: OrderItemRow[]): string {
  if (items.length === 0) {
    return '';
  }

  return items
    .map((item) => {
      const optionSegments: string[] = [];

      if (item.selected_color) optionSegments.push(`Color: ${item.selected_color}`);
      if (item.selected_size) optionSegments.push(`Size: ${item.selected_size}`);
      if (item.selected_fabric) optionSegments.push(`Fabric: ${item.selected_fabric}`);

      const options = optionSegments.length > 0 ? ` [${optionSegments.join('; ')}]` : '';
      return `${item.product_name} x${item.quantity}${options}`;
    })
    .join(' | ');
}

function getCsvHeaders(): string[] {
  return [
    'transaction_id',
    'transaction_created_at',
    'transaction_attempted_at',
    'transaction_completed_at',
    'gateway',
    'transaction_type',
    'transaction_status',
    'currency',
    'amount_cents',
    'amount',
    'gateway_transaction_id',
    'idempotency_key',
    'transaction_error_code',
    'transaction_error_message',
    'order_id',
    'order_number',
    'order_created_at',
    'customer_name',
    'customer_email',
    'customer_phone',
    'city',
    'province',
    'delivery_type',
    'delivery_fee_cents',
    'delivery_fee',
    'order_total_cents',
    'order_total',
    'payment_method',
    'order_payment_status',
    'fulfillment_status',
    'gateway_provider',
    'payment_reference',
    'payment_received_at',
    'payment_settled_at',
    'refunded_cents',
    'refunded_amount',
    'remaining_balance_cents',
    'remaining_balance',
    'order_items_count',
    'order_items_summary',
    'order_items_json',
  ];
}

export async function GET(request: Request) {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const { searchParams } = new URL(request.url);
  const month = parseIntegerParam(searchParams.get('month'));
  const year = parseIntegerParam(searchParams.get('year'));
  const currentYear = new Date().getUTCFullYear();

  if (!month || month < 1 || month > 12 || !year || year < 2000 || year > currentYear + 1) {
    return NextResponse.json({ error: 'Invalid month or year query parameters.' }, { status: 400 });
  }

  const rangeStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const rangeEnd = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

  const supabase = createSupabaseAdminClient();
  const { data: transactionsData, error: transactionsError } = await supabase
    .from('payment_transactions')
    .select(
      'id, order_id, gateway, transaction_type, status, amount_cents, currency, gateway_transaction_id, idempotency_key, error_code, error_message, attempted_at, completed_at, created_at, updated_at, orders:order_id(id, order_number, created_at, customer_name, customer_email, customer_phone, city, province, delivery_type, delivery_fee_cents, total_cents, payment_method, payment_status, fulfillment_status, gateway_provider, payment_reference, payment_received_at, payment_settled_at, refunded_cents, remaining_balance_cents)'
    )
    .gte('created_at', rangeStart.toISOString())
    .lt('created_at', rangeEnd.toISOString())
    .order('created_at', { ascending: false });

  if (transactionsError) {
    return NextResponse.json({ error: transactionsError.message }, { status: 500 });
  }

  const transactions = (transactionsData ?? []) as TransactionRow[];
  const orderIds = Array.from(new Set(transactions.map((transaction) => transaction.order_id).filter(Boolean)));

  const orderItemsByOrderId = new Map<string, OrderItemRow[]>();
  if (orderIds.length > 0) {
    const { data: orderItemsData, error: orderItemsError } = await supabase
      .from('order_items')
      .select(
        'order_id, product_name, quantity, unit_price_cents, line_total_cents, selected_color, selected_size, selected_fabric'
      )
      .in('order_id', orderIds);

    if (orderItemsError) {
      return NextResponse.json({ error: orderItemsError.message }, { status: 500 });
    }

    (orderItemsData ?? []).forEach((item) => {
      const typedItem = item as OrderItemRow;
      const existing = orderItemsByOrderId.get(typedItem.order_id);

      if (existing) {
        existing.push(typedItem);
        return;
      }

      orderItemsByOrderId.set(typedItem.order_id, [typedItem]);
    });
  }

  const headers = getCsvHeaders();
  const rows: CsvRow[] = transactions.map((transaction) => {
    const order = normalizeOrder(transaction.orders);
    const orderItems = orderItemsByOrderId.get(transaction.order_id) ?? [];

    return {
      transaction_id: transaction.id,
      transaction_created_at: transaction.created_at,
      transaction_attempted_at: transaction.attempted_at,
      transaction_completed_at: transaction.completed_at,
      gateway: transaction.gateway,
      transaction_type: transaction.transaction_type,
      transaction_status: transaction.status,
      currency: transaction.currency,
      amount_cents: transaction.amount_cents,
      amount: centsToAmount(transaction.amount_cents),
      gateway_transaction_id: transaction.gateway_transaction_id,
      idempotency_key: transaction.idempotency_key,
      transaction_error_code: transaction.error_code,
      transaction_error_message: transaction.error_message,
      order_id: transaction.order_id,
      order_number: order?.order_number,
      order_created_at: order?.created_at,
      customer_name: order?.customer_name,
      customer_email: order?.customer_email,
      customer_phone: order?.customer_phone,
      city: order?.city,
      province: order?.province,
      delivery_type: order?.delivery_type,
      delivery_fee_cents: order?.delivery_fee_cents,
      delivery_fee: order ? centsToAmount(order.delivery_fee_cents) : '',
      order_total_cents: order?.total_cents,
      order_total: order ? centsToAmount(order.total_cents) : '',
      payment_method: order?.payment_method,
      order_payment_status: order?.payment_status,
      fulfillment_status: order?.fulfillment_status,
      gateway_provider: order?.gateway_provider,
      payment_reference: order?.payment_reference,
      payment_received_at: order?.payment_received_at,
      payment_settled_at: order?.payment_settled_at,
      refunded_cents: order?.refunded_cents,
      refunded_amount: order ? centsToAmount(order.refunded_cents) : '',
      remaining_balance_cents: order?.remaining_balance_cents,
      remaining_balance: order ? centsToAmount(order.remaining_balance_cents) : '',
      order_items_count: orderItems.length,
      order_items_summary: buildOrderItemsSummary(orderItems),
      order_items_json: JSON.stringify(orderItems),
    };
  });

  const csvContent = serializeCsv(headers, rows);
  const fileName = `transactions-${year}-${String(month).padStart(2, '0')}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
