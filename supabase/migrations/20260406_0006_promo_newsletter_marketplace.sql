create table if not exists public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null unique,
  source text not null default 'footer',
  status text not null default 'subscribed' check (status in ('subscribed', 'unsubscribed')),
  unsubscribed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text not null default '',
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(10, 2) not null check (discount_value > 0),
  min_order_cents integer not null default 0 check (min_order_cents >= 0),
  max_discount_cents integer check (max_discount_cents >= 0),
  usage_limit integer check (usage_limit >= 0),
  usage_limit_per_user integer check (usage_limit_per_user >= 0),
  times_used integer not null default 0 check (times_used >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_vendor_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  business_name text not null,
  contact_name text not null,
  email text not null,
  phone text not null default '',
  website text,
  category text not null default 'General',
  message text not null default '',
  status text not null default 'new' check (status in ('new', 'reviewing', 'approved', 'rejected', 'archived')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.orders
  add column if not exists promo_code_id uuid references public.promo_codes(id) on delete set null,
  add column if not exists promo_discount_cents integer not null default 0 check (promo_discount_cents >= 0);

create table if not exists public.promo_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  promo_code_id uuid not null references public.promo_codes(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  code_snapshot text not null,
  subtotal_cents integer not null check (subtotal_cents >= 0),
  discount_cents integer not null check (discount_cents >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique(order_id, promo_code_id)
);

create index if not exists newsletter_subscriptions_email_idx
  on public.newsletter_subscriptions(email);

create index if not exists newsletter_subscriptions_status_created_idx
  on public.newsletter_subscriptions(status, created_at desc);

create index if not exists promo_codes_code_active_idx
  on public.promo_codes(code, is_active);

create index if not exists promo_codes_validity_idx
  on public.promo_codes(starts_at, ends_at);

create index if not exists marketplace_vendor_applications_status_created_idx
  on public.marketplace_vendor_applications(status, created_at desc);

create index if not exists marketplace_vendor_applications_email_idx
  on public.marketplace_vendor_applications(email);

create index if not exists orders_promo_code_id_idx
  on public.orders(promo_code_id);

create index if not exists promo_code_redemptions_promo_user_idx
  on public.promo_code_redemptions(promo_code_id, user_id, created_at desc);

create index if not exists promo_code_redemptions_order_idx
  on public.promo_code_redemptions(order_id);

drop trigger if exists newsletter_subscriptions_set_updated_at on public.newsletter_subscriptions;
create trigger newsletter_subscriptions_set_updated_at
before update on public.newsletter_subscriptions
for each row
execute function public.set_updated_at();

drop trigger if exists promo_codes_set_updated_at on public.promo_codes;
create trigger promo_codes_set_updated_at
before update on public.promo_codes
for each row
execute function public.set_updated_at();

drop trigger if exists marketplace_vendor_applications_set_updated_at on public.marketplace_vendor_applications;
create trigger marketplace_vendor_applications_set_updated_at
before update on public.marketplace_vendor_applications
for each row
execute function public.set_updated_at();

alter table public.newsletter_subscriptions enable row level security;
alter table public.promo_codes enable row level security;
alter table public.promo_code_redemptions enable row level security;
alter table public.marketplace_vendor_applications enable row level security;

drop policy if exists "newsletter_subscriptions_insert_anon" on public.newsletter_subscriptions;
create policy "newsletter_subscriptions_insert_anon"
on public.newsletter_subscriptions
for insert
to anon
with check (user_id is null);

drop policy if exists "newsletter_subscriptions_insert_authenticated" on public.newsletter_subscriptions;
create policy "newsletter_subscriptions_insert_authenticated"
on public.newsletter_subscriptions
for insert
to authenticated
with check (user_id is null or user_id = auth.uid());

drop policy if exists "newsletter_subscriptions_select_own_or_admin" on public.newsletter_subscriptions;
create policy "newsletter_subscriptions_select_own_or_admin"
on public.newsletter_subscriptions
for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "newsletter_subscriptions_update_admin" on public.newsletter_subscriptions;
create policy "newsletter_subscriptions_update_admin"
on public.newsletter_subscriptions
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

drop policy if exists "promo_codes_admin_manage" on public.promo_codes;
create policy "promo_codes_admin_manage"
on public.promo_codes
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

drop policy if exists "promo_code_redemptions_select_own_or_admin" on public.promo_code_redemptions;
create policy "promo_code_redemptions_select_own_or_admin"
on public.promo_code_redemptions
for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "promo_code_redemptions_admin_manage" on public.promo_code_redemptions;
create policy "promo_code_redemptions_admin_manage"
on public.promo_code_redemptions
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

drop policy if exists "marketplace_vendor_applications_insert_anon" on public.marketplace_vendor_applications;
create policy "marketplace_vendor_applications_insert_anon"
on public.marketplace_vendor_applications
for insert
to anon
with check (user_id is null);

drop policy if exists "marketplace_vendor_applications_insert_authenticated" on public.marketplace_vendor_applications;
create policy "marketplace_vendor_applications_insert_authenticated"
on public.marketplace_vendor_applications
for insert
to authenticated
with check (user_id is null or user_id = auth.uid());

drop policy if exists "marketplace_vendor_applications_select_own_or_admin" on public.marketplace_vendor_applications;
create policy "marketplace_vendor_applications_select_own_or_admin"
on public.marketplace_vendor_applications
for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "marketplace_vendor_applications_update_admin" on public.marketplace_vendor_applications;
create policy "marketplace_vendor_applications_update_admin"
on public.marketplace_vendor_applications
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
