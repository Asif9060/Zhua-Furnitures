alter table public.store_settings
  add column if not exists free_shipping_threshold_cents integer not null default 500000
  check (free_shipping_threshold_cents >= 0);

create table if not exists public.delivery_zones (
  province_code text primary key,
  province_name text not null,
  cities text[] not null default '{}',
  standard_fee_cents integer not null default 0 check (standard_fee_cents >= 0),
  express_fee_cents integer not null default 0 check (express_fee_cents >= 0),
  standard_days text not null default '3-5',
  express_days text not null default '1-2',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists delivery_zones_active_sort_idx
  on public.delivery_zones(is_active, sort_order, province_code);

drop trigger if exists delivery_zones_set_updated_at on public.delivery_zones;
create trigger delivery_zones_set_updated_at
before update on public.delivery_zones
for each row
execute function public.set_updated_at();

alter table public.delivery_zones enable row level security;

drop policy if exists "delivery_zones_public_read_active" on public.delivery_zones;
create policy "delivery_zones_public_read_active"
on public.delivery_zones
for select
using (is_active = true);

drop policy if exists "delivery_zones_admin_manage" on public.delivery_zones;
create policy "delivery_zones_admin_manage"
on public.delivery_zones
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

insert into public.delivery_zones (
  province_code,
  province_name,
  cities,
  standard_fee_cents,
  express_fee_cents,
  standard_days,
  express_days,
  is_active,
  sort_order
)
values
  ('GP', 'Gauteng', array['Johannesburg', 'Pretoria', 'Midrand', 'Sandton', 'Centurion'], 0, 29900, '3-5', '1-2', true, 1),
  ('WC', 'Western Cape', array['Cape Town', 'Stellenbosch', 'Paarl', 'George', 'Knysna'], 29900, 59900, '4-6', '2-3', true, 2),
  ('KZN', 'KwaZulu-Natal', array['Durban', 'Pietermaritzburg', 'Richards Bay', 'Ballito', 'Umhlanga'], 29900, 59900, '4-6', '2-3', true, 3),
  ('EC', 'Eastern Cape', array['Port Elizabeth', 'East London', 'Mthatha', 'Grahamstown'], 39900, 79900, '5-7', '3-4', true, 4),
  ('LP', 'Limpopo', array['Polokwane', 'Tzaneen', 'Thohoyandou', 'Louis Trichardt'], 39900, 79900, '5-7', '3-4', true, 5),
  ('MP', 'Mpumalanga', array['Nelspruit', 'Witbank', 'Secunda', 'Barberton'], 34900, 69900, '4-6', '2-3', true, 6),
  ('NW', 'North West', array['Rustenburg', 'Mahikeng', 'Klerksdorp', 'Brits'], 34900, 69900, '4-6', '2-3', true, 7),
  ('NC', 'Northern Cape', array['Kimberley', 'Upington', 'Springbok', 'De Aar'], 49900, 99900, '6-8', '4-5', true, 8),
  ('FS', 'Free State', array['Bloemfontein', 'Welkom', 'Bethlehem', 'Sasolburg'], 34900, 69900, '4-6', '2-3', true, 9)
on conflict (province_code) do update
set
  province_name = excluded.province_name,
  cities = excluded.cities,
  standard_fee_cents = excluded.standard_fee_cents,
  express_fee_cents = excluded.express_fee_cents,
  standard_days = excluded.standard_days,
  express_days = excluded.express_days,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;
