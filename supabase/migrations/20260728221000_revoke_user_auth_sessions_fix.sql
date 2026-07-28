-- refresh_tokens.user_id is varchar; sessions.user_id is uuid.

create or replace function public.revoke_user_auth_sessions(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null then
    raise exception 'user_id is required' using errcode = '22023';
  end if;

  delete from auth.refresh_tokens where user_id = p_user_id::text;
  delete from auth.sessions where user_id = p_user_id;
end;
$$;
