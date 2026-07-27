-- Migration: assign_complaint RPC
-- Requirements 7.2, 7.6, 14.1
-- Administrator-only. Atomically sets status=ASSIGNED + assignee and writes the
-- COMPLAINT_ASSIGN audit entry in the same transaction; rejects if the complaint
-- is already RESOLVED. A STATUS_CHANGE event is appended to the history.

create function public.assign_complaint(
  p_complaint_id uuid,
  p_staff_id uuid
)
returns public.maintenance_complaint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_complaint public.maintenance_complaint;
  v_old_status public.complaint_status;
begin
  perform public.require_permission('COMPLAINT_ASSIGN');

  select * into v_complaint
    from public.maintenance_complaint
   where id = p_complaint_id
     for update;

  if v_complaint.id is null then
    raise exception 'complaint % not found', p_complaint_id using errcode = 'P0002';
  end if;

  if v_complaint.status = 'RESOLVED' then
    raise exception 'cannot assign a resolved complaint' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.profiles
    where user_id = p_staff_id and role = 'MAINTENANCE_STAFF'
  ) then
    raise exception 'assignee % is not a maintenance staff member', p_staff_id using errcode = '22023';
  end if;

  v_old_status := v_complaint.status;

  update public.maintenance_complaint
     set status = 'ASSIGNED', assigned_to = p_staff_id
   where id = p_complaint_id
  returning * into v_complaint;

  insert into public.complaint_event (complaint_id, actor_user_id, event_type, old_status, new_status)
  values (p_complaint_id, auth.uid(), 'STATUS_CHANGE', v_old_status, 'ASSIGNED');

  perform public.record_audit(
    'COMPLAINT_ASSIGN', 'maintenance_complaint', p_complaint_id,
    'status', v_old_status::text, 'ASSIGNED'
  );

  return v_complaint;
end;
$$;

comment on function public.assign_complaint is
  'Administrator-only atomic assignment: status=ASSIGNED + assignee + COMPLAINT_ASSIGN '
  'audit entry; rejects a RESOLVED complaint. Requirements 7.2, 7.6, 14.1';

grant execute on function public.assign_complaint(uuid, uuid) to authenticated, service_role;
