create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location text not null default '',
  project text not null default '',
  before_image jsonb,
  after_image jsonb,
  status text not null default 'draft' check (status in ('published', 'draft')),
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null default '',
  rating integer not null default 5 check (rating between 1 and 5),
  text text not null,
  project text not null default '',
  avatar_image jsonb,
  before_image jsonb,
  after_image jsonb,
  status text not null default 'published' check (status in ('published', 'draft')),
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists gallery_items_status_order_idx
  on public.gallery_items(status, display_order, created_at desc);

create index if not exists testimonials_status_order_idx
  on public.testimonials(status, display_order, created_at desc);

create trigger gallery_items_set_updated_at
before update on public.gallery_items
for each row
execute function public.set_updated_at();

create trigger testimonials_set_updated_at
before update on public.testimonials
for each row
execute function public.set_updated_at();

alter table public.gallery_items enable row level security;
alter table public.testimonials enable row level security;

create policy "gallery_items_public_read_published"
on public.gallery_items
for select
using (status = 'published');

create policy "gallery_items_admin_write"
on public.gallery_items
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

create policy "testimonials_public_read_published"
on public.testimonials
for select
using (status = 'published');

create policy "testimonials_admin_write"
on public.testimonials
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
