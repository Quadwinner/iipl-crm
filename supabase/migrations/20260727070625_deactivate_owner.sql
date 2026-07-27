-- Migration: deactivate_owner function
-- Task 6.5: Admin-only flow setting office_owners.status = DEACTIVATED and writing audit entry
-- Requirements: 4.7, 14.1

-- Internal function for atomic status update + audit log
-- Called by Edge Function after revoking auth sessions
create function public.deactivate_owner_internal(p_owner_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner public.office_owners;
  v_old_status public.owner_status;
begin
  -- Lock and fetch owner
  select * into v_owner
    from public.office_owners
   where id = p_owner_id
     for update;

  if not found then
    raise exception 'office owner not found: %', p_owner_id
      using errcode = '22023';
  end if;

  v_old_status := v_owner.status;

  if v_old_status = 'DEACTIVATED' then
    raise exception 'office owner is already deactivated'
      using errcode = '22023';
  end if;

  -- Update status
  update public.office_owners
     set status = 'DEACTIVATED',
         updated_at = now()
   where id = p_owner_id;

  -- Record audit entry
  perform public.record_audit(
    'OWNER_DEACTIVATE',
    'office_owners',
    p_owner_id,
    'status',
    v_old_status::text,
    'DEACTIVATED'
  );

  return jsonb_build_object(
    'success', true,
    'owner_id', p_owner_id,
    'previous_status', v_old_status,
    'new_status', 'DEACTIVATED'
  );
end;
$$;

grant execute on function public.deactivate_owner_internal(uuid) to service_role;

comment on function public.deactivate_owner_internal(uuid) is
  'Internal function called by deactivate-owner Edge Function after revoking auth sessions. Updates office_owners.status and records audit entry atomically.';
