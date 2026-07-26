-- Lockout bookkeeping runs pre-authentication, so these are SECURITY DEFINER and
-- callable by anon. They deliberately return nothing that distinguishes an unknown
-- email from a known one (Requirement 5.2).

create function public.is_account_locked(p_email text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_locked_until timestamptz;
begin
  select p.locked_until into v_locked_until
  from public.profiles p
  join auth.users u on u.id = p.user_id
  where lower(u.email) = lower(p_email);

  return coalesce(v_locked_until > now(), false);
end;
$$;

create function public.record_login_failure(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_threshold integer;
  v_duration integer;
  v_count integer;
begin
  select u.id into v_user_id
  from auth.users u
  where lower(u.email) = lower(p_email);

  if v_user_id is null then
    return;
  end if;

  select lockout_threshold, lockout_duration_minutes
    into v_threshold, v_duration
  from public.global_config where id = 1;

  update public.profiles
     set failed_login_count = failed_login_count + 1
   where user_id = v_user_id
  returning failed_login_count into v_count;

  if v_count >= v_threshold then
    update public.profiles
       set locked_until = now() + make_interval(mins => v_duration),
           failed_login_count = 0
     where user_id = v_user_id;
  end if;
end;
$$;

create function public.record_login_success()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
     set failed_login_count = 0,
         locked_until = null,
         last_activity_at = now()
   where user_id = auth.uid();
end;
$$;

grant execute on function public.is_account_locked(text) to anon, authenticated, service_role;
grant execute on function public.record_login_failure(text) to anon, authenticated, service_role;
grant execute on function public.record_login_success() to authenticated, service_role;
