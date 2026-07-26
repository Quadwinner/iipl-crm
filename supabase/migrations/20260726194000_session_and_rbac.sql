create function public.current_role()
returns public.role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where user_id = auth.uid();
$$;

create function public.session_expired()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_last timestamptz;
  v_timeout integer;
begin
  if auth.uid() is null then
    return true;
  end if;

  select last_activity_at into v_last from public.profiles where user_id = auth.uid();
  select session_timeout_minutes into v_timeout from public.global_config where id = 1;

  return v_last is null or v_last < now() - make_interval(mins => v_timeout);
end;
$$;

create function public.touch_session()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expired boolean;
begin
  v_expired := public.session_expired();

  if not v_expired then
    update public.profiles set last_activity_at = now() where user_id = auth.uid();
  end if;

  return not v_expired;
end;
$$;

create table public.role_permissions (
  permission_key text not null,
  role public.role not null,
  primary key (permission_key, role)
);

insert into public.role_permissions (permission_key, role) values
  ('UNIT_CREATE', 'ADMINISTRATOR'),
  ('UNIT_UPDATE', 'ADMINISTRATOR'),
  ('UNIT_READ', 'ADMINISTRATOR'),
  ('UNIT_READ', 'MAINTENANCE_STAFF'),
  ('ALLOTMENT_MANAGE', 'ADMINISTRATOR'),
  ('OWNER_ACCOUNT_CREATE', 'ADMINISTRATOR'),
  ('OWNER_ACCOUNT_DEACTIVATE', 'ADMINISTRATOR'),
  ('COMPLAINT_ASSIGN', 'ADMINISTRATOR'),
  ('COMPLAINT_RESOLVE', 'ADMINISTRATOR'),
  ('COMPLAINT_RESOLVE', 'MAINTENANCE_STAFF'),
  ('COMPLAINT_SUBMIT', 'OFFICE_OWNER'),
  ('CONFIG_MANAGE', 'ADMINISTRATOR'),
  ('AUDIT_READ', 'ADMINISTRATOR'),
  ('BILLING_READ_ALL', 'ADMINISTRATOR'),
  ('REPORT_EXPORT', 'ADMINISTRATOR');

create function public.authorize(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.role_permissions
    where permission_key = p_permission
      and role = public.current_role()
  );
$$;

-- Raises instead of returning false, so callers get a descriptive error and the
-- surrounding transaction aborts (Requirement 5.5).
create function public.require_permission(p_permission text)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.authorize(p_permission) then
    raise exception 'permission denied: % requires a role you do not hold', p_permission
      using errcode = '42501';
  end if;
end;
$$;

alter table public.role_permissions enable row level security;

create policy role_permissions_select on public.role_permissions
  for select to authenticated
  using (true);

revoke all on public.role_permissions from anon;
grant select on public.role_permissions to authenticated;
grant all on public.role_permissions to service_role;

grant execute on function public.current_role() to authenticated, service_role;
grant execute on function public.session_expired() to authenticated, service_role;
grant execute on function public.touch_session() to authenticated, service_role;
grant execute on function public.authorize(text) to authenticated, service_role;
grant execute on function public.require_permission(text) to authenticated, service_role;
