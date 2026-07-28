-- Keep lease rent, unit base rent, and open invoices in sync when rent changes.
-- Editing office_unit.base_rent_amount alone did not update the active lease, so the
-- owner portal kept showing the old rent_amount.

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
         total_amount = round(
           round(p_rent_amount, 2) + i.additional_charges + coalesce(i.electricity_amount, 0),
           2
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

comment on function public.apply_lease_rent_change is
  'Internal helper: updates lease rent and recomputes unpaid invoice totals.';

revoke all on function public.apply_lease_rent_change(uuid, numeric) from public;
grant execute on function public.apply_lease_rent_change(uuid, numeric) to service_role;

create function public.update_lease_rent(
  p_allotment_id uuid,
  p_rent_amount numeric
)
returns public.lease
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_allotment public.allotment;
  v_lease public.lease;
begin
  perform public.require_permission('ALLOTMENT_MANAGE');

  select * into v_allotment
    from public.allotment
   where id = p_allotment_id
     for update;

  if not found then
    raise exception 'allotment % not found', p_allotment_id using errcode = 'P0002';
  end if;

  if v_allotment.status <> 'ACTIVE' then
    raise exception 'rent can only be changed on an active allotment'
      using errcode = '22023';
  end if;

  select * into v_lease
    from public.lease
   where allotment_id = p_allotment_id;

  if not found then
    raise exception 'lease not found for allotment %', p_allotment_id using errcode = 'P0002';
  end if;

  v_lease := public.apply_lease_rent_change(v_lease.id, p_rent_amount);

  update public.office_unit
     set base_rent_amount = v_lease.rent_amount
   where id = v_allotment.office_unit_id;

  return v_lease;
end;
$$;

comment on function public.update_lease_rent is
  'Administrator updates active lease rent, syncs the unit base rent, and refreshes '
  'unpaid invoices so the owner portal shows the new amount.';

grant execute on function public.update_lease_rent(uuid, numeric)
  to authenticated, service_role;

create or replace function public.update_office_unit(
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
  v_lease_id uuid;
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

  if p_base_rent_amount is not null and v_row.occupancy_status = 'OCCUPIED' then
    select l.id into v_lease_id
      from public.allotment a
      join public.lease l on l.allotment_id = a.id
     where a.office_unit_id = p_unit_id
       and a.status = 'ACTIVE'
     limit 1;

    if v_lease_id is not null then
      perform public.apply_lease_rent_change(v_lease_id, p_base_rent_amount);
    end if;
  end if;

  return v_row;
exception
  when unique_violation then
    raise exception 'unit code % already exists in this building', p_unit_code
      using errcode = '23505';
end;
$$;

comment on function public.update_office_unit is
  'Updates office unit fields. When base rent changes on an occupied unit, the active '
  'lease rent and unpaid invoices are updated too.';
