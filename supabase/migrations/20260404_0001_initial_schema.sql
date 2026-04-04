create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null check (category in ('furniture', 'curtains', 'accessories')),
  subcategory text not null default 'General',
  price_cents integer not null check (price_cents >= 0),
  original_price_cents integer,
  rating numeric(2, 1) not null default 5.0,
  review_count integer not null default 0,
  badge text check (badge in ('new', 'sale', 'custom', 'bestseller')),
  description text not null default '',
  long_description text not null default '',
  images jsonb not null default '[]'::jsonb,
  colors jsonb not null default '[]'::jsonb,
  sizes text[] not null default '{}',
  fabrics text[] not null default '{}',
  in_stock boolean not null default true,
  is_customizable boolean not null default false,
  delivery_days text not null default '7-10 business days',
  features text[] not null default '{}',
  stock integer not null default 0,
  sku text not null unique,
  status text not null default 'active' check (status in ('active', 'draft', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  address text not null,
  city text not null,
  province text not null,
  postal_code text not null,
  delivery_type text not null default 'standard',
  delivery_fee_cents integer not null default 0,
  total_cents integer not null check (total_cents >= 0),
  payment_method text not null default 'placeholder',
  payment_status text not null default 'placeholder' check (payment_status in ('pending', 'paid', 'partial', 'failed', 'placeholder')),
  fulfillment_status text not null default 'pending' check (fulfillment_status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0),
  line_total_cents integer not null check (line_total_cents >= 0),
  selected_color text,
  selected_size text,
  selected_fabric text,
  custom_note text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  route text not null,
  status text not null default 'draft' check (status in ('published', 'scheduled', 'draft')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.store_settings (
  id text primary key default 'default',
  store_name text not null,
  support_email text not null,
  currency text not null default 'ZAR',
  order_prefix text not null default 'ZE-2026',
  automation jsonb not null default '{"autoConfirmPayments": false, "lowStockAlerts": true, "reviewModerationQueue": true}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists products_category_idx on public.products(category);
create index if not exists products_status_idx on public.products(status);
create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists content_blocks_route_idx on public.content_blocks(route);

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

create trigger orders_set_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

create trigger content_blocks_set_updated_at
before update on public.content_blocks
for each row
execute function public.set_updated_at();

create trigger store_settings_set_updated_at
before update on public.store_settings
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.content_blocks enable row level security;
alter table public.store_settings enable row level security;

create policy "profiles_select_own_or_admin"
on public.profiles
for select
using (
  auth.uid() = id
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "profiles_update_own_or_admin"
on public.profiles
for update
using (
  auth.uid() = id
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  auth.uid() = id
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "products_public_read"
on public.products
for select
using (true);

create policy "products_admin_write"
on public.products
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

create policy "orders_insert_guest"
on public.orders
for insert
to anon
with check (user_id is null);

create policy "orders_insert_authenticated"
on public.orders
for insert
to authenticated
with check (user_id is null or user_id = auth.uid());

create policy "orders_select_own_or_admin"
on public.orders
for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "orders_update_admin"
on public.orders
for update
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

create policy "order_items_insert_linked_owner"
on public.order_items
for insert
to authenticated
with check (
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

create policy "order_items_select_linked_owner"
on public.order_items
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

create policy "content_blocks_public_read_published"
on public.content_blocks
for select
using (status = 'published');

create policy "content_blocks_admin_write"
on public.content_blocks
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

create policy "store_settings_admin_manage"
on public.store_settings
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
