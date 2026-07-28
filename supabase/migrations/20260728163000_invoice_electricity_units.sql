-- Add consumed electricity units (kWh / meter units) on invoices.

alter table public.invoice
  add column if not exists electricity_units numeric(12, 2)
    check (electricity_units is null or electricity_units >= 0);

comment on column public.invoice.electricity_units is
  'Optional meter units consumed for this billing cycle (e.g. kWh).';

drop function if exists public.get_billing_report(uuid, uuid, public.invoice_status);
drop function if exists public.get_invoices_for_owner();
drop function if exists public.billing_report_rows(uuid, uuid, public.invoice_status);
drop function if exists public.set_invoice_electricity_charge(uuid, numeric, text);

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
  electricity_amount numeric,
  electricity_units numeric,
  electricity_note text,
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
    i.electricity_amount,
    i.electricity_units,
    i.electricity_note,
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

revoke all on function public.billing_report_rows(uuid, uuid, public.invoice_status) from public;
grant execute on function public.billing_report_rows(uuid, uuid, public.invoice_status) to service_role;

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
  electricity_amount numeric,
  electricity_units numeric,
  electricity_note text,
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

grant execute on function public.get_invoices_for_owner() to authenticated, service_role;

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
  electricity_amount numeric,
  electricity_units numeric,
  electricity_note text,
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

grant execute on function public.get_billing_report(uuid, uuid, public.invoice_status)
  to authenticated, service_role;

create function public.set_invoice_electricity_charge(
  p_invoice_id uuid,
  p_amount numeric,
  p_note text default null,
  p_units numeric default null
)
returns public.invoice
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invoice public.invoice;
  v_prev numeric(12, 2);
  v_note text;
  v_units numeric(12, 2);
begin
  perform public.require_permission('BILLING_READ_ALL');

  if p_amount is null or p_amount < 0 or p_amount > 9999999.99 then
    raise exception 'electricity amount must be between 0 and 9,999,999.99'
      using errcode = '22023';
  end if;

  if p_units is not null and (p_units < 0 or p_units > 9999999.99) then
    raise exception 'electricity units must be between 0 and 9,999,999.99'
      using errcode = '22023';
  end if;

  v_note := nullif(btrim(coalesce(p_note, '')), '');
  if v_note is not null and char_length(v_note) > 500 then
    raise exception 'electricity note must be at most 500 characters'
      using errcode = '22023';
  end if;

  -- Treat blank / NaN-style null as clearing units; 0 is a valid reading.
  v_units := case when p_units is null then null else round(p_units, 2) end;

  select * into v_invoice
    from public.invoice
   where id = p_invoice_id
     for update;

  if not found then
    raise exception 'invoice not found' using errcode = 'P0002';
  end if;

  if v_invoice.status = 'PAID' then
    raise exception 'cannot change electricity charges on a paid invoice'
      using errcode = '22023';
  end if;

  v_prev := v_invoice.electricity_amount;

  update public.invoice
     set electricity_amount = round(p_amount, 2),
         electricity_units = v_units,
         electricity_note = v_note,
         total_amount = round(rent_amount + additional_charges + p_amount, 2)
   where id = p_invoice_id
   returning * into v_invoice;

  perform public.record_audit(
    'INVOICE_ELECTRICITY',
    'invoice',
    v_invoice.id,
    'electricity_amount',
    v_prev::text,
    v_invoice.electricity_amount::text
  );

  return v_invoice;
end;
$$;

comment on function public.set_invoice_electricity_charge is
  'Administrator sets electricity amount, optional consumed units, and note on an unpaid '
  'invoice so the tenant can pay utilities with rent.';

grant execute on function public.set_invoice_electricity_charge(uuid, numeric, text, numeric)
  to authenticated, service_role;
