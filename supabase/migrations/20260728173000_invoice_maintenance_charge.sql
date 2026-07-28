-- Maintenance fee on invoices (billed with rent, after electricity).

alter table public.invoice
  add column if not exists maintenance_amount numeric(12, 2) not null default 0
    check (maintenance_amount >= 0),
  add column if not exists maintenance_note text
    check (
      maintenance_note is null
      or char_length(maintenance_note) between 1 and 500
    );

comment on column public.invoice.maintenance_amount is
  'Building / common-area maintenance fee for this billing cycle; payable with rent.';
comment on column public.invoice.maintenance_note is
  'Optional label for the maintenance charge (e.g. month or service description).';

create or replace function public.invoice_charge_total(
  p_rent numeric,
  p_additional numeric,
  p_electricity numeric,
  p_maintenance numeric
)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select round(
    coalesce(p_rent, 0)
    + coalesce(p_additional, 0)
    + coalesce(p_electricity, 0)
    + coalesce(p_maintenance, 0),
    2
  );
$$;

drop function if exists public.get_billing_report(uuid, uuid, public.invoice_status);
drop function if exists public.get_invoices_for_owner();
drop function if exists public.billing_report_rows(uuid, uuid, public.invoice_status);
drop function if exists public.set_invoice_electricity_charge(uuid, numeric, text, numeric);
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
  maintenance_amount numeric,
  maintenance_note text,
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
    i.maintenance_amount,
    i.maintenance_note,
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
  maintenance_amount numeric,
  maintenance_note text,
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
  maintenance_amount numeric,
  maintenance_note text,
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
         total_amount = public.invoice_charge_total(
           rent_amount,
           additional_charges,
           round(p_amount, 2),
           maintenance_amount
         )
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

grant execute on function public.set_invoice_electricity_charge(uuid, numeric, text, numeric)
  to authenticated, service_role;

create function public.set_invoice_maintenance_charge(
  p_invoice_id uuid,
  p_amount numeric,
  p_note text default null
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
begin
  perform public.require_permission('BILLING_READ_ALL');

  if p_amount is null or p_amount < 0 or p_amount > 9999999.99 then
    raise exception 'maintenance amount must be between 0 and 9,999,999.99'
      using errcode = '22023';
  end if;

  v_note := nullif(btrim(coalesce(p_note, '')), '');
  if v_note is not null and char_length(v_note) > 500 then
    raise exception 'maintenance note must be at most 500 characters'
      using errcode = '22023';
  end if;

  select * into v_invoice
    from public.invoice
   where id = p_invoice_id
     for update;

  if not found then
    raise exception 'invoice not found' using errcode = 'P0002';
  end if;

  if v_invoice.status = 'PAID' then
    raise exception 'cannot change maintenance charges on a paid invoice'
      using errcode = '22023';
  end if;

  v_prev := v_invoice.maintenance_amount;

  update public.invoice
     set maintenance_amount = round(p_amount, 2),
         maintenance_note = v_note,
         total_amount = public.invoice_charge_total(
           rent_amount,
           additional_charges,
           electricity_amount,
           round(p_amount, 2)
         )
   where id = p_invoice_id
   returning * into v_invoice;

  perform public.record_audit(
    'INVOICE_MAINTENANCE',
    'invoice',
    v_invoice.id,
    'maintenance_amount',
    v_prev::text,
    v_invoice.maintenance_amount::text
  );

  return v_invoice;
end;
$$;

comment on function public.set_invoice_maintenance_charge is
  'Administrator sets the maintenance fee on an unpaid invoice so the tenant can pay '
  'it together with rent and electricity.';

grant execute on function public.set_invoice_maintenance_charge(uuid, numeric, text)
  to authenticated, service_role;

create or replace function public.apply_lease_rent_change(
  p_lease_id uuid,
  p_rent_amount numeric
)
returns public.lease
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lease public.lease;
  v_prev_rent numeric(12, 2);
begin
  if p_rent_amount is null or p_rent_amount <= 0 or p_rent_amount > 9999999.99 then
    raise exception 'rent amount must be between 0.01 and 9,999,999.99'
      using errcode = '22023';
  end if;

  select * into v_lease
    from public.lease
   where id = p_lease_id
     for update;

  if not found then
    raise exception 'lease % not found', p_lease_id using errcode = 'P0002';
  end if;

  v_prev_rent := v_lease.rent_amount;

  if round(p_rent_amount, 2) = v_prev_rent then
    return v_lease;
  end if;

  update public.lease
     set rent_amount = round(p_rent_amount, 2)
   where id = p_lease_id
  returning * into v_lease;

  update public.invoice i
     set rent_amount = round(p_rent_amount, 2),
         total_amount = public.invoice_charge_total(
           round(p_rent_amount, 2),
           i.additional_charges,
           i.electricity_amount,
           i.maintenance_amount
         )
   where i.lease_id = p_lease_id
     and i.status in ('DUE', 'PARTIALLY_PAID', 'OVERDUE');

  perform public.record_audit(
    'LEASE_RENT_UPDATE',
    'lease',
    p_lease_id,
    'rent_amount',
    v_prev_rent::text,
    v_lease.rent_amount::text
  );

  return v_lease;
end;
$$;
