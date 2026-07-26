create type public.occupancy_status as enum ('VACANT', 'OCCUPIED');

create table public.building (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 150),
  address text not null check (char_length(address) between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.office_unit (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.building (id) on delete restrict,
  unit_code text not null check (char_length(unit_code) between 1 and 50),
  floor integer not null check (floor between -5 and 200),
  size_sqft numeric(12, 2) not null check (size_sqft > 0 and size_sqft <= 1000000),
  base_rent_amount numeric(12, 2) not null
    check (base_rent_amount >= 0.01 and base_rent_amount <= 9999999.99),
  occupancy_status public.occupancy_status not null default 'VACANT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (building_id, unit_code)
);

create index office_unit_building_idx on public.office_unit (building_id);
create index office_unit_status_idx on public.office_unit (occupancy_status);

create function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger building_touch_updated_at
  before update on public.building
  for each row execute function public.touch_updated_at();

create trigger office_unit_touch_updated_at
  before update on public.office_unit
  for each row execute function public.touch_updated_at();

create function public.create_office_unit(
  p_building_id uuid,
  p_unit_code text,
  p_floor integer,
  p_size_sqft numeric,
  p_base_rent_amount numeric
)
returns public.office_unit
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.office_unit;
begin
  perform public.require_permission('UNIT_CREATE');

  insert into public.office_unit (building_id, unit_code, floor, size_sqft, base_rent_amount)
  values (p_building_id, p_unit_code, p_floor, p_size_sqft, p_base_rent_amount)
  returning * into v_row;

  return v_row;
exception
  when unique_violation then
    raise exception 'unit code % already exists in this building', p_unit_code
      using errcode = '23505';
end;
$$;

-- Nulls mean "leave unchanged" so partial updates don't require resending every field.
create function public.update_office_unit(
  p_unit_id uuid,
  p_building_id uuid default null,
  p_unit_code text default null,
  p_floor integer default null,
  p_size_sqft numeric default null,
  p_base_rent_amount numeric default null
)
returns public.office_unit
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.office_unit;
begin
  perform public.require_permission('UNIT_UPDATE');

  update public.office_unit
     set building_id = coalesce(p_building_id, building_id),
         unit_code = coalesce(p_unit_code, unit_code),
         floor = coalesce(p_floor, floor),
         size_sqft = coalesce(p_size_sqft, size_sqft),
         base_rent_amount = coalesce(p_base_rent_amount, base_rent_amount)
   where id = p_unit_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'office unit % not found', p_unit_id using errcode = 'P0002';
  end if;

  return v_row;
exception
  when unique_violation then
    raise exception 'unit code % already exists in this building', p_unit_code
      using errcode = '23505';
end;
$$;

create function public.occupancy_summary(p_building_id uuid default null)
returns table (occupied_count bigint, vacant_count bigint, total_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    count(*) filter (where occupancy_status = 'OCCUPIED'),
    count(*) filter (where occupancy_status = 'VACANT'),
    count(*)
  from public.office_unit
  where p_building_id is null or building_id = p_building_id;
$$;

alter table public.building enable row level security;
alter table public.office_unit enable row level security;

create policy building_select_staff on public.building
  for select to authenticated
  using (public.authorize('UNIT_READ'));

create policy building_write_admin on public.building
  for all to authenticated
  using (public.is_administrator())
  with check (public.is_administrator());

create policy office_unit_select_staff on public.office_unit
  for select to authenticated
  using (public.authorize('UNIT_READ'));

create policy office_unit_write_admin on public.office_unit
  for all to authenticated
  using (public.is_administrator())
  with check (public.is_administrator());

revoke all on public.building, public.office_unit from anon;
grant select, insert, update, delete on public.building to authenticated;
grant select, insert, update, delete on public.office_unit to authenticated;
grant all on public.building, public.office_unit to service_role;

grant execute on function public.create_office_unit(uuid, text, integer, numeric, numeric)
  to authenticated, service_role;
grant execute on function public.update_office_unit(uuid, uuid, text, integer, numeric, numeric)
  to authenticated, service_role;
grant execute on function public.occupancy_summary(uuid) to authenticated, service_role;
