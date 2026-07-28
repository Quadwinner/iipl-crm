-- Admin-facing deactivate: permission check, session revoke, status + audit in one RPC.
-- Avoids Edge Function cold-start latency that blocked the admin UI.

create or replace function public.deactivate_owner(p_owner_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  perform public.require_permission('OWNER_ACCOUNT_DEACTIVATE');

  select user_id
    into v_user_id
    from public.office_owners
   where id = p_owner_id;

  if not found then
    raise exception 'office owner not found: %', p_owner_id
      using errcode = 'P0002';
  end if;

  perform public.revoke_user_auth_sessions(v_user_id);

  return public.deactivate_owner_internal(p_owner_id);
end;
$$;

revoke all on function public.deactivate_owner(uuid) from public;
grant execute on function public.deactivate_owner(uuid) to authenticated;

comment on function public.deactivate_owner(uuid) is
  'Administrator-only: revoke auth sessions and set office_owners.status to DEACTIVATED with audit.';
