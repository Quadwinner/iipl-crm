-- Migration: update_complaint_status RPC
-- Requirements 7.3, 7.4, 7.7
-- Only the assigned Maintenance_Staff member (or an Administrator) may move a
-- complaint to IN_PROGRESS or RESOLVED. Records the change as a complaint_event
-- with actor + timestamp and enqueues a COMPLAINT_STATUS notification to the owner.

create function public.update_complaint_status(
  p_complaint_id uuid,
  p_new_status public.complaint_status
)
returns public.maintenance_complaint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_complaint public.maintenance_complaint;
  v_old_status public.complaint_status;
  v_owner_user_id uuid;
begin
  -- Gates out Office_Owners entirely; ADMINISTRATOR and MAINTENANCE_STAFF hold this.
  perform public.require_permission('COMPLAINT_RESOLVE');

  if p_new_status not in ('IN_PROGRESS', 'RESOLVED') then
    raise exception 'status can only be updated to IN_PROGRESS or RESOLVED' using errcode = '22023';
  end if;

  select * into v_complaint
    from public.maintenance_complaint
   where id = p_complaint_id
     for update;

  if v_complaint.id is null then
    raise exception 'complaint % not found', p_complaint_id using errcode = 'P0002';
  end if;

  -- A non-assigned maintenance staff member may not update; only the assignee or an admin.
  if not public.is_administrator() and v_complaint.assigned_to is distinct from auth.uid() then
    raise exception 'only the assigned staff member may update this complaint' using errcode = '42501';
  end if;

  v_old_status := v_complaint.status;

  update public.maintenance_complaint
     set status = p_new_status
   where id = p_complaint_id
  returning * into v_complaint;

  insert into public.complaint_event (complaint_id, actor_user_id, event_type, old_status, new_status)
  values (p_complaint_id, auth.uid(), 'STATUS_CHANGE', v_old_status, p_new_status);

  select user_id into v_owner_user_id
    from public.office_owners
   where id = v_complaint.office_owner_id;

  perform public.enqueue_notification(
    v_owner_user_id,
    'EMAIL',
    'COMPLAINT_STATUS',
    jsonb_build_object(
      'complaint_id', p_complaint_id,
      'old_status', v_old_status,
      'new_status', p_new_status
    )
  );

  return v_complaint;
end;
$$;

comment on function public.update_complaint_status is
  'Assigned staff (or Administrator) moves a complaint to IN_PROGRESS/RESOLVED, '
  'records the change with actor + timestamp, and notifies the owner. Requirements 7.3, 7.4, 7.7';

grant execute on function public.update_complaint_status(uuid, public.complaint_status)
  to authenticated, service_role;
