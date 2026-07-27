-- Migration: complaint listing queries
-- Requirements 6.2, 6.3, 7.1
-- SECURITY INVOKER so maintenance_complaint RLS applies (owners see only their own,
-- staff/admin see all). list_complaints_for_owner resolves the owner from auth.uid().

create function public.list_complaints_for_owner()
returns table (
  id uuid,
  office_unit_id uuid,
  unit_code text,
  building_name text,
  office_owner_id uuid,
  owner_name text,
  category text,
  description text,
  status public.complaint_status,
  assigned_to uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    c.id,
    c.office_unit_id,
    u.unit_code,
    b.name::text,
    c.office_owner_id,
    o.name::text,
    c.category,
    c.description,
    c.status,
    c.assigned_to,
    c.created_at,
    c.updated_at
  from public.maintenance_complaint c
  join public.office_unit u on u.id = c.office_unit_id
  join public.building b on b.id = u.building_id
  join public.office_owners o on o.id = c.office_owner_id
  where c.office_owner_id = public.current_office_owner_id()
  order by c.created_at desc;
$$;

comment on function public.list_complaints_for_owner is
  'Owner-scoped complaint list (resolved from auth.uid()). Requirements 6.2, 6.3';

create function public.list_all_complaints(
  p_category text default null,
  p_office_unit_id uuid default null,
  p_office_owner_id uuid default null,
  p_status public.complaint_status default null,
  p_created_from timestamptz default null,
  p_created_to timestamptz default null
)
returns table (
  id uuid,
  office_unit_id uuid,
  unit_code text,
  building_name text,
  office_owner_id uuid,
  owner_name text,
  category text,
  description text,
  status public.complaint_status,
  assigned_to uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    c.id,
    c.office_unit_id,
    u.unit_code,
    b.name::text,
    c.office_owner_id,
    o.name::text,
    c.category,
    c.description,
    c.status,
    c.assigned_to,
    c.created_at,
    c.updated_at
  from public.maintenance_complaint c
  join public.office_unit u on u.id = c.office_unit_id
  join public.building b on b.id = u.building_id
  join public.office_owners o on o.id = c.office_owner_id
  where (p_category is null or c.category = p_category)
    and (p_office_unit_id is null or c.office_unit_id = p_office_unit_id)
    and (p_office_owner_id is null or c.office_owner_id = p_office_owner_id)
    and (p_status is null or c.status = p_status)
    and (p_created_from is null or c.created_at >= p_created_from)
    and (p_created_to is null or c.created_at <= p_created_to)
  order by c.created_at desc;
$$;

comment on function public.list_all_complaints is
  'Admin/staff complaint list with category/unit/owner/status/creation-date filters. Requirement 7.1';

grant execute on function public.list_complaints_for_owner() to authenticated, service_role;
grant execute on function public.list_all_complaints(text, uuid, uuid, public.complaint_status, timestamptz, timestamptz)
  to authenticated, service_role;
