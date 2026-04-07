alter table public.orders
  drop constraint if exists orders_payment_status_check;

alter table public.orders
  add constraint orders_payment_status_check
  check (payment_status in ('awaiting_payment', 'pending', 'paid', 'partial', 'failed', 'placeholder'));

alter table public.orders
  add column if not exists gateway_provider text not null default 'placeholder'
    check (gateway_provider in ('payfast', 'yoco', 'payflex', 'manual', 'placeholder')),
  add column if not exists gateway_transaction_id text,
  add column if not exists payment_session_id text,
  add column if not exists payment_reference text,
  add column if not exists payment_attempt_count integer not null default 0
    check (payment_attempt_count >= 0),
  add column if not exists last_payment_attempt_at timestamptz,
  add column if not exists payment_received_at timestamptz,
  add column if not exists payment_settled_at timestamptz,
  add column if not exists payment_error_message text,
  add column if not exists refunded_cents integer not null default 0
    check (refunded_cents >= 0),
  add column if not exists remaining_balance_cents integer not null default 0
    check (remaining_balance_cents >= 0);

create index if not exists orders_payment_status_created_idx
  on public.orders(payment_status, created_at desc);

create index if not exists orders_gateway_provider_idx
  on public.orders(gateway_provider);

create index if not exists orders_payment_reference_idx
  on public.orders(payment_reference);

create index if not exists orders_payment_session_id_idx
  on public.orders(payment_session_id);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  gateway text not null check (gateway in ('payfast', 'yoco', 'payflex', 'manual')),
  transaction_type text not null check (transaction_type in ('authorization', 'capture', 'sale', 'refund', 'void')),
  status text not null check (status in ('pending', 'succeeded', 'failed', 'cancelled')),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'ZAR',
  gateway_transaction_id text,
  idempotency_key text,
  gateway_response jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  attempted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists payment_transactions_gateway_transaction_unique
  on public.payment_transactions(gateway, gateway_transaction_id)
  where gateway_transaction_id is not null;

create unique index if not exists payment_transactions_idempotency_key_unique
  on public.payment_transactions(idempotency_key)
  where idempotency_key is not null;

create index if not exists payment_transactions_order_created_idx
  on public.payment_transactions(order_id, created_at desc);

create index if not exists payment_transactions_status_created_idx
  on public.payment_transactions(status, created_at desc);

create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  gateway text not null check (gateway in ('payfast', 'yoco', 'payflex')),
  webhook_id text not null,
  event_type text not null default 'unknown',
  related_order_id uuid references public.orders(id) on delete set null,
  processing_status text not null default 'received'
    check (processing_status in ('received', 'processed', 'ignored', 'failed')),
  processor_attempt_count integer not null default 0 check (processor_attempt_count >= 0),
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  received_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(gateway, webhook_id)
);

create index if not exists payment_webhook_events_related_order_idx
  on public.payment_webhook_events(related_order_id);

create index if not exists payment_webhook_events_status_received_idx
  on public.payment_webhook_events(processing_status, received_at desc);

drop trigger if exists payment_transactions_set_updated_at on public.payment_transactions;
create trigger payment_transactions_set_updated_at
before update on public.payment_transactions
for each row
execute function public.set_updated_at();

drop trigger if exists payment_webhook_events_set_updated_at on public.payment_webhook_events;
create trigger payment_webhook_events_set_updated_at
before update on public.payment_webhook_events
for each row
execute function public.set_updated_at();

alter table public.payment_transactions enable row level security;
alter table public.payment_webhook_events enable row level security;

drop policy if exists "payment_transactions_select_own_or_admin" on public.payment_transactions;
create policy "payment_transactions_select_own_or_admin"
on public.payment_transactions
for select
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "payment_transactions_admin_manage" on public.payment_transactions;
create policy "payment_transactions_admin_manage"
on public.payment_transactions
for all
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "payment_webhook_events_admin_read" on public.payment_webhook_events;
create policy "payment_webhook_events_admin_read"
on public.payment_webhook_events
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "payment_webhook_events_admin_manage" on public.payment_webhook_events;
create policy "payment_webhook_events_admin_manage"
on public.payment_webhook_events
for all
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);
