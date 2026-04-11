create table if not exists public.user_carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_carts_user_id_idx on public.user_carts(user_id);

create trigger user_carts_set_updated_at
before update on public.user_carts
for each row
execute function public.set_updated_at();

alter table public.user_carts enable row level security;

create policy "user_carts_select_own_or_admin"
on public.user_carts
for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "user_carts_insert_own"
on public.user_carts
for insert
to authenticated
with check (user_id = auth.uid());

create policy "user_carts_update_own_or_admin"
on public.user_carts
for update
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "user_carts_delete_own_or_admin"
on public.user_carts
for delete
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);
