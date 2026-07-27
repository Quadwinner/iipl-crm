-- Migration: get_allotment_history query
-- Requirement 3.8
-- Returns every allotment for an office unit with owner, lease dates, rent, status.
-- SECURITY INVOKER so allotment/lease RLS applies (Administrator sees all, an
-- Office_Owner sees only their own).

create function public.get_allotment_history(p_office_unit_id uuid)
returns table (
  allotment_id uuid,
  office_unit_id uuid,
  office_owner_id uuid,
  owner_name text,
  owner_contact_email text,
  lease_start_date date,
  lease_end_date date,
  rent_amount numeric,
  billing_cycle public.billing_cycle,
  status public.allotment_status,
  created_at timestamptz,
  terminated_at timestamptz,
  expiration_reason text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    a.id,
    a.office_unit_id,
    a.office_owner_id,
    o.name::text,
    o.contact_email::text,
    l.start_date,
    l.end_date,
    l.rent_amount,
    l.billing_cycle,
    a.status,
    a.created_at,
    a.terminated_at,
    a.expiration_reason
  from public.allotment a
  join public.office_owners o on o.id = a.office_owner_id
  left join public.lease l on l.allotment_id = a.id
  where a.office_unit_id = p_office_unit_id
  order by a.created_at desc;
$$;

comment on function public.get_allotment_history is
  'Full allotment history for an office unit (owner, lease dates, rent, status). '
  'Requirement 3.8';

grant execute on function public.get_allotment_history(uuid) to authenticated, service_role;
