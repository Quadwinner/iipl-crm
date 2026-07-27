-- Migration: dashboard and reporting functions (Task 25.1, 25.2, 25.4)
-- Requirements 12.1, 12.2, 12.3, 12.4, 12.6
--
-- Three Administrator-gated reads plus one shared date-range guard:
--   * assert_valid_date_range  - rejects start_date > end_date (12.6), reused by the
--     revenue dashboard and the export data function.
--   * get_occupancy_dashboard  - total/occupied/vacant counts and occupancy rate (12.1),
--     reusing the existing occupancy_summary aggregation, with an optional Building
--     filter (12.3, 12.4). Divide-by-zero on an empty inventory yields a 0% rate.
--   * get_revenue_dashboard    - total rent collected, total outstanding dues, and
--     overdue Invoice count for a date range (default: current calendar month) and
--     optional Building filter (12.2, 12.3, 12.4).
--   * get_report_export        - the export data set (billing detail rows) restricted to
--     exactly the same Building + date-range window the dashboards use, so a CSV/PDF
--     export always matches the on-screen figures (12.5). Reuses billing_report_rows.
--
-- All are SECURITY DEFINER (they read owner/unit/building/invoice/payment rows an
-- Administrator can already see, but the aggregation helpers they call are definer) and
-- authorize explicitly via require_permission. Dashboards require REPORT_VIEW; the export
-- requires REPORT_EXPORT.

-- Shared date-range guard (Task 25.4, Requirement 12.6). Raises 22023 (invalid input) so
-- callers can map it to an HTTP 400. A null bound (open range) is permitted.
create function public.assert_valid_date_range(p_start date, p_end date)
returns void
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_start is not null and p_end is not null and p_start > p_end then
    raise exception 'invalid date range: start_date (%) must not be after end_date (%)',
      p_start, p_end
      using errcode = '22023';
  end if;
end;
$$;

comment on function public.assert_valid_date_range is
  'Rejects a date range whose start_date is after its end_date (errcode 22023). Shared by '
  'the revenue dashboard and report export. Requirement 12.6';

grant execute on function public.assert_valid_date_range(date, date)
  to authenticated, service_role;

-- Occupancy dashboard (Task 25.1, Requirements 12.1, 12.3, 12.4).
create function public.get_occupancy_dashboard(p_building_id uuid default null)
returns table (
  total_units integer,
  occupied_count integer,
  vacant_count integer,
  occupancy_rate_percent integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_permission('REPORT_VIEW');

  return query
    select
      s.total_count::integer,
      s.occupied_count::integer,
      s.vacant_count::integer,
      case
        when s.total_count = 0 then 0
        else round(s.occupied_count::numeric * 100 / s.total_count)::integer
      end
    from public.occupancy_summary(p_building_id) s;
end;
$$;

comment on function public.get_occupancy_dashboard is
  'Administrator occupancy dashboard: total/occupied/vacant Office_Unit counts and the '
  'occupancy rate rounded to the nearest whole percent, optionally filtered to one '
  'Building. Requirements 12.1, 12.3, 12.4';

grant execute on function public.get_occupancy_dashboard(uuid)
  to authenticated, service_role;

-- Revenue dashboard (Task 25.2, Requirements 12.2, 12.3, 12.4).
-- Rent collected is summed from COMPLETED Payments settled within the window; outstanding
-- dues and the overdue count are computed from Invoices whose due_date falls in the
-- window. Outstanding per Invoice nets out its COMPLETED Payments and is floored at zero.
create function public.get_revenue_dashboard(
  p_start_date date default null,
  p_end_date date default null,
  p_building_id uuid default null
)
returns table (
  range_start date,
  range_end date,
  total_rent_collected numeric,
  total_outstanding_dues numeric,
  overdue_invoice_count integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_start date;
  v_end date;
begin
  perform public.require_permission('REPORT_VIEW');

  -- Default to the current calendar month when no range is supplied (12.2).
  if p_start_date is null and p_end_date is null then
    v_start := date_trunc('month', current_date)::date;
    v_end := (date_trunc('month', current_date) + interval '1 month' - interval '1 day')::date;
  else
    v_start := p_start_date;
    v_end := p_end_date;
  end if;

  if v_start is null or v_end is null then
    raise exception 'both start_date and end_date are required for a custom date range'
      using errcode = '22023';
  end if;

  perform public.assert_valid_date_range(v_start, v_end);

  return query
    with collected as (
      select coalesce(sum(p.amount), 0)::numeric(12, 2) as amount
      from public.payment p
      join public.invoice i on i.id = p.invoice_id
      join public.office_unit u on u.id = i.office_unit_id
      where p.status = 'COMPLETED'
        and p.completed_at is not null
        and p.completed_at::date between v_start and v_end
        and (p_building_id is null or u.building_id = p_building_id)
    ),
    invoices_in_window as (
      select i.id, i.total_amount, i.status
      from public.invoice i
      join public.office_unit u on u.id = i.office_unit_id
      where i.due_date between v_start and v_end
        and (p_building_id is null or u.building_id = p_building_id)
    ),
    outstanding as (
      select coalesce(sum(
        greatest(
          w.total_amount - coalesce((
            select sum(p2.amount)
            from public.payment p2
            where p2.invoice_id = w.id
              and p2.status = 'COMPLETED'
          ), 0),
          0
        )
      ), 0)::numeric(12, 2) as amount
      from invoices_in_window w
      where w.status <> 'PAID'
    ),
    overdue as (
      select count(*)::integer as cnt
      from invoices_in_window w
      where w.status = 'OVERDUE'
    )
    select v_start, v_end, collected.amount, outstanding.amount, overdue.cnt
    from collected, outstanding, overdue;
end;
$$;

comment on function public.get_revenue_dashboard is
  'Administrator revenue dashboard: total rent collected, total outstanding dues, and '
  'overdue Invoice count for a date range (default: current calendar month), optionally '
  'filtered to one Building. Requirements 12.2, 12.3, 12.4';

grant execute on function public.get_revenue_dashboard(date, date, uuid)
  to authenticated, service_role;

-- Export data set (Task 25.6, Requirement 12.5). Returns the billing detail rows for the
-- active Building + date-range window, restricted to exactly the same Invoices the revenue
-- dashboard aggregates (due_date in [start, end]). Reuses billing_report_rows so the export
-- and the on-screen billing view share one underlying query. Gated by REPORT_EXPORT.
create function public.get_report_export(
  p_start_date date default null,
  p_end_date date default null,
  p_building_id uuid default null
)
returns table (
  invoice_id uuid,
  office_owner_id uuid,
  owner_name text,
  office_unit_id uuid,
  unit_code text,
  building_id uuid,
  building_name text,
  billing_cycle_key text,
  billing_period_start date,
  billing_period_end date,
  total_amount numeric,
  due_date date,
  status public.invoice_status
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_start date;
  v_end date;
begin
  perform public.require_permission('REPORT_EXPORT');

  if p_start_date is null and p_end_date is null then
    v_start := date_trunc('month', current_date)::date;
    v_end := (date_trunc('month', current_date) + interval '1 month' - interval '1 day')::date;
  else
    v_start := p_start_date;
    v_end := p_end_date;
  end if;

  if v_start is null or v_end is null then
    raise exception 'both start_date and end_date are required for a custom date range'
      using errcode = '22023';
  end if;

  perform public.assert_valid_date_range(v_start, v_end);

  return query
    select
      r.invoice_id,
      r.office_owner_id,
      r.owner_name,
      r.office_unit_id,
      r.unit_code,
      r.building_id,
      r.building_name,
      r.billing_cycle_key,
      r.billing_period_start,
      r.billing_period_end,
      r.total_amount,
      r.due_date,
      r.status
    from public.billing_report_rows(p_building_id, null, null) r
    where r.due_date between v_start and v_end
    order by r.due_date, r.building_name, r.unit_code;
end;
$$;

comment on function public.get_report_export is
  'Billing detail rows for the active Building + date-range window, matching exactly the '
  'Invoices the revenue dashboard aggregates. Backs the CSV/PDF export so it always '
  'reflects the on-screen filter state. Requirement 12.5';

grant execute on function public.get_report_export(date, date, uuid)
  to authenticated, service_role;
