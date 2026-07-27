-- Migration: invoice query/reporting functions
-- Requirements 8.3, 8.5
-- One shared aggregation (billing_report_rows) joins invoice -> owner/unit/building and
-- applies Building/Office_Owner/status filters. get_invoices_for_owner scopes it to the
-- caller's own server-resolved office_owner_id; get_billing_report exposes the full
-- filterable report to Administrators. The dashboard export (Task 25.7) reuses the same
-- aggregation.
--
-- billing_report_rows is SECURITY DEFINER so it can read owner/unit/building rows that an
-- Office_Owner cannot see directly under RLS. It performs no authorization itself, so it
-- is never exposed to authenticated callers directly (execute revoked from public) — only
-- the two guarded wrappers below invoke it.

create function public.billing_report_rows(
  p_building_id uuid default null,
  p_office_owner_id uuid default null,
  p_status public.invoice_status default null
)
returns table (
  invoice_id uuid,
  lease_id uuid,
  office_owner_id uuid,
  owner_name text,
  office_unit_id uuid,
  unit_code text,
  building_id uuid,
  building_name text,
  billing_cycle_key text,
  billing_period_start date,
  billing_period_end date,
  rent_amount numeric,
  additional_charges numeric,
  total_amount numeric,
  due_date date,
  status public.invoice_status,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    i.id,
    i.lease_id,
    i.office_owner_id,
    o.name::text,
    i.office_unit_id,
    u.unit_code,
    b.id,
    b.name::text,
    i.billing_cycle_key,
    i.billing_period_start,
    i.billing_period_end,
    i.rent_amount,
    i.additional_charges,
    i.total_amount,
    i.due_date,
    i.status,
    i.created_at
  from public.invoice i
  join public.office_owners o on o.id = i.office_owner_id
  join public.office_unit u on u.id = i.office_unit_id
  join public.building b on b.id = u.building_id
  where (p_building_id is null or b.id = p_building_id)
    and (p_office_owner_id is null or i.office_owner_id = p_office_owner_id)
    and (p_status is null or i.status = p_status)
  order by i.created_at desc;
$$;

comment on function public.billing_report_rows is
  'Shared invoice aggregation (owner/unit/building joins + filters) backing '
  'get_invoices_for_owner, get_billing_report, and the dashboard export. Not authorized '
  'itself — only guarded wrappers may call it. Requirements 8.3, 8.5';

revoke all on function public.billing_report_rows(uuid, uuid, public.invoice_status) from public;
grant execute on function public.billing_report_rows(uuid, uuid, public.invoice_status) to service_role;

-- Owner-scoped invoice list: resolves the caller's office_owner_id server-side and never
-- accepts a client-supplied id. Returns nothing when the caller is not an Office_Owner.
create function public.get_invoices_for_owner()
returns table (
  invoice_id uuid,
  lease_id uuid,
  office_owner_id uuid,
  owner_name text,
  office_unit_id uuid,
  unit_code text,
  building_id uuid,
  building_name text,
  billing_cycle_key text,
  billing_period_start date,
  billing_period_end date,
  rent_amount numeric,
  additional_charges numeric,
  total_amount numeric,
  due_date date,
  status public.invoice_status,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_owner uuid := public.current_office_owner_id();
begin
  if v_owner is null then
    return;
  end if;

  return query
    select * from public.billing_report_rows(null, v_owner, null);
end;
$$;

comment on function public.get_invoices_for_owner is
  'Invoices for the authenticated Office_Owner (owner id resolved from auth.uid()), each '
  'with its status. Requirement 8.3';

grant execute on function public.get_invoices_for_owner() to authenticated, service_role;

-- Admin billing history / outstanding dues across all owners, filterable by Building,
-- Office_Owner, and Invoice status.
create function public.get_billing_report(
  p_building_id uuid default null,
  p_office_owner_id uuid default null,
  p_status public.invoice_status default null
)
returns table (
  invoice_id uuid,
  lease_id uuid,
  office_owner_id uuid,
  owner_name text,
  office_unit_id uuid,
  unit_code text,
  building_id uuid,
  building_name text,
  billing_cycle_key text,
  billing_period_start date,
  billing_period_end date,
  rent_amount numeric,
  additional_charges numeric,
  total_amount numeric,
  due_date date,
  status public.invoice_status,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_permission('BILLING_READ_ALL');

  return query
    select * from public.billing_report_rows(p_building_id, p_office_owner_id, p_status);
end;
$$;

comment on function public.get_billing_report is
  'Administrator billing history and outstanding dues across all owners, filterable by '
  'Building, Office_Owner, and Invoice status. Requirement 8.5';

grant execute on function public.get_billing_report(uuid, uuid, public.invoice_status)
  to authenticated, service_role;
