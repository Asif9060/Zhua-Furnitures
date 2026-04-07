create table if not exists public.contact_enquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text not null default '',
  message text not null,
  source text not null default 'website',
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.installation_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  product_id text,
  product_name text not null,
  address text not null,
  preferred_date date not null,
  preferred_slot text not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists contact_enquiries_status_created_idx
  on public.contact_enquiries(status, created_at desc);

create index if not exists contact_enquiries_email_idx
  on public.contact_enquiries(email);

create index if not exists installation_bookings_status_date_idx
  on public.installation_bookings(status, preferred_date, created_at desc);

create index if not exists installation_bookings_customer_email_idx
  on public.installation_bookings(customer_email);

drop trigger if exists contact_enquiries_set_updated_at on public.contact_enquiries;
create trigger contact_enquiries_set_updated_at
before update on public.contact_enquiries
for each row
execute function public.set_updated_at();

drop trigger if exists installation_bookings_set_updated_at on public.installation_bookings;
create trigger installation_bookings_set_updated_at
before update on public.installation_bookings
for each row
execute function public.set_updated_at();

alter table public.contact_enquiries enable row level security;
alter table public.installation_bookings enable row level security;

create policy "contact_enquiries_insert_anon"
on public.contact_enquiries
for insert
to anon
with check (user_id is null);

create policy "contact_enquiries_insert_authenticated"
on public.contact_enquiries
for insert
to authenticated
with check (user_id is null or user_id = auth.uid());

create policy "contact_enquiries_select_own_or_admin"
on public.contact_enquiries
for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "contact_enquiries_update_admin"
on public.contact_enquiries
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

create policy "installation_bookings_insert_anon"
on public.installation_bookings
for insert
to anon
with check (user_id is null);

create policy "installation_bookings_insert_authenticated"
on public.installation_bookings
for insert
to authenticated
with check (user_id is null or user_id = auth.uid());

create policy "installation_bookings_select_own_or_admin"
on public.installation_bookings
for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "installation_bookings_update_admin"
on public.installation_bookings
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
