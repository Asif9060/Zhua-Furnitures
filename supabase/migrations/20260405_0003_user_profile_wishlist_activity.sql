alter table public.profiles
  add column if not exists phone text,
  add column if not exists avatar_url text,
  add column if not exists address_primary jsonb not null default '{}'::jsonb;

create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_is_admin boolean;
begin
  if new.role = old.role then
    return new;
  end if;

  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
  into requester_is_admin;

  if requester_is_admin then
    return new;
  end if;

  raise exception 'Only admins can change profile roles.';
end;
$$;

drop trigger if exists profiles_prevent_role_change on public.profiles;
create trigger profiles_prevent_role_change
before update on public.profiles
for each row
execute function public.prevent_profile_role_change();

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  marketing_email boolean not null default true,
  sms_notifications boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(user_id, product_id)
);

create table if not exists public.user_activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  action_type text not null check (
    action_type in (
      'login',
      'logout',
      'order_created',
      'order_status_changed',
      'wishlist_added',
      'wishlist_removed',
      'profile_updated',
      'password_changed',
      'password_reset_requested',
      'product_viewed'
    )
  ),
  resource_type text not null check (
    resource_type in ('auth', 'order', 'wishlist', 'profile', 'product')
  ),
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_browsing_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id text not null,
  viewed_at timestamptz not null default timezone('utc', now()),
  context jsonb not null default '{}'::jsonb
);

create index if not exists user_preferences_user_id_idx on public.user_preferences(user_id);
create index if not exists user_wishlist_user_id_created_idx on public.user_wishlist(user_id, created_at desc);
create index if not exists user_wishlist_product_id_idx on public.user_wishlist(product_id);
create index if not exists user_activity_log_user_id_created_idx on public.user_activity_log(user_id, created_at desc);
create index if not exists user_activity_log_action_idx on public.user_activity_log(action_type, created_at desc);
create index if not exists user_browsing_history_user_id_viewed_idx on public.user_browsing_history(user_id, viewed_at desc);
create index if not exists user_browsing_history_product_idx on public.user_browsing_history(product_id, viewed_at desc);

create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row
execute function public.set_updated_at();

create trigger user_wishlist_set_updated_at
before update on public.user_wishlist
for each row
execute function public.set_updated_at();

alter table public.user_preferences enable row level security;
alter table public.user_wishlist enable row level security;
alter table public.user_activity_log enable row level security;
alter table public.user_browsing_history enable row level security;

create policy "user_preferences_select_own_or_admin"
on public.user_preferences
for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "user_preferences_insert_own"
on public.user_preferences
for insert
to authenticated
with check (user_id = auth.uid());

create policy "user_preferences_update_own"
on public.user_preferences
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

create policy "user_wishlist_select_own_or_admin"
on public.user_wishlist
for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "user_wishlist_insert_own"
on public.user_wishlist
for insert
to authenticated
with check (user_id = auth.uid());

create policy "user_wishlist_delete_own_or_admin"
on public.user_wishlist
for delete
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "user_activity_log_select_own_or_admin"
on public.user_activity_log
for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "user_activity_log_insert_own_or_admin"
on public.user_activity_log
for insert
to authenticated
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "user_browsing_history_select_own_or_admin"
on public.user_browsing_history
for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "user_browsing_history_insert_own_or_admin"
on public.user_browsing_history
for insert
to authenticated
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "user_browsing_history_delete_own_or_admin"
on public.user_browsing_history
for delete
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);
