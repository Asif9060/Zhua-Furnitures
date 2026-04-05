alter table public.products
  add column if not exists weight_kg numeric(10, 2) not null default 0,
  add column if not exists width_cm numeric(10, 2) not null default 0,
  add column if not exists depth_cm numeric(10, 2) not null default 0,
  add column if not exists height_cm numeric(10, 2) not null default 0;
