create function public.list_office_units(
  p_building_id uuid default null,
  p_occupancy_status public.occupancy_status default null
)
returns table (
  id uuid,
  building_id uuid,
  building_name text,
  unit_code text,
  floor integer,
  size_sqft numeric,
  base_rent_amount numeric,
  occupancy_status public.occupancy_status,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    u.id,
    u.building_id,
    b.name as building_name,
    u.unit_code,
    u.floor,
    u.size_sqft,
    u.base_rent_amount,
    u.occupancy_status,
    u.created_at,
    u.updated_at
  from public.office_unit u
  join public.building b on b.id = u.building_id
  where (p_building_id is null or u.building_id = p_building_id)
    and (p_occupancy_status is null or u.occupancy_status = p_occupancy_status)
  order by b.name, u.unit_code;
$$;

grant execute on function public.list_office_units(uuid, public.occupancy_status)
  to authenticated, service_role;
