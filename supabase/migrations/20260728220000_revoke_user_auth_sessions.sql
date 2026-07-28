-- Revoke all Supabase Auth sessions for a user (service-role / Edge Function only).
-- admin.signOut() requires the user's JWT; this clears sessions by user_id instead.

create function public.revoke_user_auth_sessions(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null then
    raise exception 'user_id is required' using errcode = '22023';
  end if;

  delete from auth.refresh_tokens where user_id = p_user_id;
  delete from auth.sessions where user_id = p_user_id;
end;
$$;

revoke all on function public.revoke_user_auth_sessions(uuid) from public;
grant execute on function public.revoke_user_auth_sessions(uuid) to service_role;

comment on function public.revoke_user_auth_sessions(uuid) is
  'Deletes all auth.sessions and auth.refresh_tokens rows for a user. Called by deactivate-owner Edge Function before marking the owner DEACTIVATED.';
