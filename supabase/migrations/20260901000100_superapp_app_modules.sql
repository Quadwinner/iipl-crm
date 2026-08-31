-- Migration: app_modules — the product registry
-- One table backs BOTH the signed-in launcher at /app and the public product
-- catalogue at /products. `listed_publicly` decides whether a row is marketing
-- content; `allowed_roles` decides who sees a tile. There is deliberately no
-- second products table.

create type public.module_status as enum ('ACTIVE', 'BETA', 'COMING_SOON', 'DISABLED');

create table public.app_modules (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  tagline text not null default '',
  summary text not null default '',
  features jsonb not null default '[]'::jsonb,
  icon text not null default 'LayoutGrid',
  accent text not null default '#2563eb',
  base_path text,
  status public.module_status not null default 'COMING_SOON',
  allowed_roles public.role[] not null default '{}'::public.role[],
  listed_publicly boolean not null default true,
  marketing_slug text unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index app_modules_sort_idx on public.app_modules (sort_order, name);

create trigger app_modules_touch_updated_at
  before update on public.app_modules
  for each row execute function public.touch_updated_at();

alter table public.app_modules enable row level security;

-- Public catalogue: anyone (including anon) may read publicly listed, non-disabled
-- rows. This is the marketing surface only.
create policy app_modules_select_public on public.app_modules
  for select to anon, authenticated
  using (listed_publicly and status <> 'DISABLED');

-- Administrators see every row, disabled ones included, and are the only writers.
create policy app_modules_select_admin on public.app_modules
  for select to authenticated
  using (public.is_administrator());

create policy app_modules_write_admin on public.app_modules
  for all to authenticated
  using (public.is_administrator())
  with check (public.is_administrator());

/**
 * The launcher's only read path. Security definer so the role filter happens in
 * one place server-side: a caller can never widen it, and the client never
 * re-filters by role. DISABLED modules are never returned.
 */
create function public.modules_for_current_user()
returns setof public.app_modules
language sql
stable
security definer
set search_path = ''
as $$
  select *
    from public.app_modules
   where status <> 'DISABLED'
     and public.current_role() = any (allowed_roles)
   order by sort_order, name;
$$;

comment on function public.modules_for_current_user() is
  'Modules visible to the signed-in user, filtered by public.current_role(). The '
  'launcher calls this instead of selecting from app_modules directly.';

revoke all on public.app_modules from anon;
grant select on public.app_modules to anon, authenticated;
grant insert, update, delete on public.app_modules to authenticated;
grant all on public.app_modules to service_role;
grant execute on function public.modules_for_current_user() to authenticated, service_role;
