-- Migration: transition_allotment RPC
-- Requirements 2.2, 3.3, 3.4, 3.5, 3.6, 3.7, 14.1
-- Single function backing manual termination, admin-forced expiry (with reason),
-- scheduler-driven lease-end expiry, and manual forced expiry of past-due leases.
-- Rejects any transition on an already-terminal allotment. Atomically updates the
-- allotment status, flips occupancy to VACANT, and writes the ALLOTMENT_TRANSITION
-- audit entry (changed field, previous status, new status).

create function public.transition_allotment(
  p_allotment_id uuid,
  p_target_status public.allotment_status,
  p_reason text default null
)
returns public.allotment
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_allotment public.allotment;
  v_old_status public.allotment_status;
  v_owner_user_id uuid;
begin
  -- Client callers (auth.uid() present) must hold ALLOTMENT_MANAGE. The scheduler
  -- lease-expiry job runs with the service role (no auth.uid()) and is trusted.
  if auth.uid() is not null then
    perform public.require_permission('ALLOTMENT_MANAGE');
  end if;

  if p_target_status not in ('TERMINATED', 'EXPIRED') then
    raise exception 'invalid target status %; must be TERMINATED or EXPIRED', p_target_status
      using errcode = '22023';
  end if;

  select * into v_allotment
    from public.allotment
   where id = p_allotment_id
     for update;

  if v_allotment.id is null then
    raise exception 'allotment % not found', p_allotment_id using errcode = 'P0002';
  end if;

  -- Reject transitions on an already-terminal allotment (Requirement 3.4).
  if v_allotment.status in ('TERMINATED', 'EXPIRED') then
    raise exception 'allotment % is already %', p_allotment_id, v_allotment.status
      using errcode = '55006';
  end if;

  v_old_status := v_allotment.status;

  update public.allotment
     set status = p_target_status,
         terminated_at = now(),
         expiration_reason = case
           when p_target_status = 'EXPIRED' then p_reason
           else expiration_reason
         end
   where id = p_allotment_id
  returning * into v_allotment;

  update public.office_unit
     set occupancy_status = 'VACANT'
   where id = v_allotment.office_unit_id;

  perform public.record_audit(
    'ALLOTMENT_TRANSITION',
    'allotment',
    p_allotment_id,
    'status',
    v_old_status::text,
    p_target_status::text
  );

  select user_id into v_owner_user_id
    from public.office_owners
   where id = v_allotment.office_owner_id;

  if v_owner_user_id is not null then
    perform public.enqueue_notification(
      v_owner_user_id,
      'EMAIL',
      'ALLOTMENT_STATUS_CHANGED',
      jsonb_build_object(
        'allotment_id', v_allotment.id,
        'office_unit_id', v_allotment.office_unit_id,
        'previous_status', v_old_status,
        'new_status', p_target_status,
        'reason', p_reason
      )
    );
  end if;

  return v_allotment;
end;
$$;

comment on function public.transition_allotment is
  'Terminates or expires an allotment, atomically flipping occupancy to VACANT and '
  'writing the ALLOTMENT_TRANSITION audit entry. Rejects already-terminal allotments. '
  'Requirements 2.2, 3.3, 3.4, 3.5, 3.6, 3.7, 14.1';

grant execute on function public.transition_allotment(uuid, public.allotment_status, text)
  to authenticated, service_role;
