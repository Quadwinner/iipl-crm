-- Dashboard invoice list: include invoices paid in the selected range, not only those
-- whose due_date falls in the range. Matches get_revenue_dashboard rent collected
-- (COMPLETED payments by completed_at).

create or replace function public.get_report_export(
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
       or exists (
         select 1
         from public.payment p
         where p.invoice_id = r.invoice_id
           and p.status = 'COMPLETED'
           and p.completed_at is not null
           and p.completed_at::date between v_start and v_end
       )
    order by r.due_date, r.building_name, r.unit_code;
end;
$$;

comment on function public.get_report_export is
  'Billing detail rows for the active Building + date-range window: invoices whose due_date '
  'falls in the range or that were paid (COMPLETED payment) in the range. Backs the dashboard '
  'invoice table and CSV/PDF export so they align with rent collected. Requirement 12.5';
