-- Include GST in invoice total_amount (taxable subtotal + configured GST rate).

create or replace function public.invoice_taxable_subtotal(
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

create or replace function public.invoice_charge_total(
  p_rent numeric,
  p_additional numeric,
  p_electricity numeric,
  p_maintenance numeric
)
returns numeric
language sql
stable
set search_path = ''
as $$
  select round(
    public.invoice_taxable_subtotal(p_rent, p_additional, p_electricity, p_maintenance)
    * (1 + (select default_gst_rate_percent from public.global_config where id = 1) / 100),
    2
  );
$$;

comment on function public.invoice_taxable_subtotal is
  'Pre-GST sum of rent, additional, electricity, and maintenance charges.';
comment on function public.invoice_charge_total is
  'Invoice amount due including GST from global_config.default_gst_rate_percent.';

-- Keep unpaid invoice totals aligned when lease rent changes.
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

-- Recompute open invoices so amount due includes GST.
update public.invoice i
   set total_amount = public.invoice_charge_total(
     i.rent_amount,
     i.additional_charges,
     i.electricity_amount,
     i.maintenance_amount
   )
 where i.status in ('DUE', 'OVERDUE', 'PARTIALLY_PAID');

grant execute on function public.invoice_taxable_subtotal(numeric, numeric, numeric, numeric)
  to authenticated, service_role;
