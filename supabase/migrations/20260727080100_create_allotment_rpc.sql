-- Migration: create_allotment RPC
-- Requirements 2.1, 2.4, 3.1, 3.2, 14.1
-- Atomically: row-lock the unit, reject if occupied, insert allotment + lease,
-- flip occupancy to OCCUPIED, write the ALLOTMENT_CREATE audit entry, enqueue a
-- notification. Any failure (including the audit write) rolls the whole thing back.

create function public.create_allotment(
  p_office_unit_id uuid,
  p_office_owner_id uuid,
  p_lease_start date,
  p_lease_end date,
  p_rent_amount numeric,
  p_billing_cycle public.billing_cycle
)
returns public.allotment
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_unit public.office_unit;
  v_allotment public.allotment;
  v_owner_user_id uuid;
begin
  perform public.require_permission('ALLOTMENT_MANAGE');

  -- Lock the unit first so two concurrent allotment attempts serialize here.
  select * into v_unit
    from public.office_unit
   where id = p_office_unit_id
     for update;

  if v_unit.id is null then
    raise exception 'office unit % not found', p_office_unit_id using errcode = 'P0002';
  end if;

  if v_unit.occupancy_status = 'OCCUPIED' then
    raise exception 'office unit % is already occupied', p_office_unit_id
      using errcode = '55006';
  end if;

  select user_id into v_owner_user_id
    from public.office_owners
   where id = p_office_owner_id;

  if v_owner_user_id is null then
    raise exception 'office owner % not found', p_office_owner_id using errcode = 'P0002';
  end if;

  insert into public.allotment (office_unit_id, office_owner_id, status)
  values (p_office_unit_id, p_office_owner_id, 'ACTIVE')
  returning * into v_allotment;

  insert into public.lease (allotment_id, start_date, end_date, rent_amount, billing_cycle)
  values (v_allotment.id, p_lease_start, p_lease_end, p_rent_amount, p_billing_cycle);

  update public.office_unit
     set occupancy_status = 'OCCUPIED'
   where id = p_office_unit_id;

  perform public.record_audit('ALLOTMENT_CREATE', 'allotment', v_allotment.id);

  perform public.enqueue_notification(
    v_owner_user_id,
    'EMAIL',
    'ALLOTMENT_CREATED',
    jsonb_build_object(
      'allotment_id', v_allotment.id,
      'office_unit_id', p_office_unit_id
    )
  );

  return v_allotment;
exception
  when unique_violation then
    raise exception 'office unit % already has an active allotment', p_office_unit_id
      using errcode = '23505';
end;
$$;

comment on function public.create_allotment is
  'Atomically creates an ACTIVE allotment + lease, sets occupancy to OCCUPIED, '
  'writes the ALLOTMENT_CREATE audit entry, and enqueues a notification. '
  'Requirements 2.1, 2.4, 3.1, 3.2, 14.1';

grant execute on function public.create_allotment(uuid, uuid, date, date, numeric, public.billing_cycle)
  to authenticated, service_role;
