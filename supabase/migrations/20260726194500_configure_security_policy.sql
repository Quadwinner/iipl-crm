insert into public.role_permissions (permission_key, role) values
  ('COMPLAINT_READ_ALL', 'ADMINISTRATOR'),
  ('COMPLAINT_READ_ALL', 'MAINTENANCE_STAFF'),
  ('COMPLAINT_COMMENT', 'ADMINISTRATOR'),
  ('COMPLAINT_COMMENT', 'MAINTENANCE_STAFF'),
  ('DOCUMENT_UPLOAD', 'ADMINISTRATOR'),
  ('PAYMENT_INITIATE', 'OFFICE_OWNER'),
  ('REPORT_VIEW', 'ADMINISTRATOR')
on conflict (permission_key, role) do nothing;

create function public.configure_security_policy(
  p_session_timeout_minutes integer,
  p_lockout_threshold integer,
  p_lockout_duration_minutes integer
)
returns public.global_config
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.global_config;
begin
  perform public.require_permission('CONFIG_MANAGE');

  if p_session_timeout_minutes is null or p_session_timeout_minutes <= 0
     or p_lockout_threshold is null or p_lockout_threshold <= 0
     or p_lockout_duration_minutes is null or p_lockout_duration_minutes <= 0 then
    raise exception 'session timeout, lockout threshold and lockout duration must be positive whole numbers'
      using errcode = '22023';
  end if;

  update public.global_config
     set session_timeout_minutes = p_session_timeout_minutes,
         lockout_threshold = p_lockout_threshold,
         lockout_duration_minutes = p_lockout_duration_minutes,
         updated_at = now()
   where id = 1
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.configure_security_policy(integer, integer, integer)
  to authenticated, service_role;
