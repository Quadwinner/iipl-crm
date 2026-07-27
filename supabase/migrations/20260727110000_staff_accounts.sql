-- Migration: Maintenance_Staff account management
-- Requirements 5.3, 5.4, 7.2, 14.1
-- Adds staff identity columns to profiles, an activation flag, and the
-- create/list/deactivate functions the Admin_Portal staff screen calls.

alter table public.profiles
  add column full_name text
    check (full_name is null or char_length(full_name) between 1 and 100),
  add column phone text
    check (phone is null or (char_length(phone) between 10 and 15 and phone ~ '^\d+$')),
  add column is_active boolean not null default true;

comment on column public.profiles.is_active is
  'Company_Staff activation flag. Deactivated staff cannot be assigned complaints.';

insert into public.role_permissions (permission_key, role) values
  ('STAFF_ACCOUNT_CREATE', 'ADMINISTRATOR'),
  ('STAFF_ACCOUNT_READ', 'ADMINISTRATOR'),
  ('STAFF_ACCOUNT_MODIFY', 'ADMINISTRATOR');

-- SECURITY DEFINER so the profiles role change passes the escalation guard while the
-- caller's own permission is still checked here (Requirements 5.3, 5.5).
create function public.create_staff_account(
  p_auth_user_id uuid,
  p_full_name text,
  p_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_exists boolean;
  v_audit_id uuid;
begin
  perform public.require_permission('STAFF_ACCOUNT_CREATE');

  if p_auth_user_id is null
     or not exists (select 1 from auth.users where id = p_auth_user_id) then
    raise exception 'auth user not found' using errcode = '22023';
  end if;

  if p_full_name is null or char_length(p_full_name) not between 1 and 100 then
    raise exception 'name must be 1-100 characters' using errcode = '22023';
  end if;

  if p_phone is null or char_length(p_phone) not between 10 and 15 or p_phone !~ '^\d+$' then
    raise exception 'phone must be 10-15 digits' using errcode = '22023';
  end if;

  select exists (select 1 from public.profiles where user_id = p_auth_user_id)
    into v_profile_exists;

  if v_profile_exists then
    update public.profiles
       set role = 'MAINTENANCE_STAFF',
           full_name = p_full_name,
           phone = p_phone,
           is_active = true,
           last_activity_at = now()
     where user_id = p_auth_user_id;
  else
    insert into public.profiles (user_id, role, full_name, phone)
    values (p_auth_user_id, 'MAINTENANCE_STAFF', p_full_name, p_phone);
  end if;

  -- Requirement 14.1/14.4: the audit row shares this transaction, so a failed audit
  -- write rolls the account creation back.
  v_audit_id := public.record_audit(
    'STAFF_CREATE',
    'profiles',
    p_auth_user_id,
    null,
    null,
    null
  );

  if v_audit_id is null then
    raise exception 'failed to record audit entry for staff creation';
  end if;

  return jsonb_build_object(
    'user_id', p_auth_user_id,
    'full_name', p_full_name,
    'phone', p_phone,
    'role', 'MAINTENANCE_STAFF',
    'is_active', true
  );
end;
$$;

comment on function public.create_staff_account(uuid, text, text) is
  'Sets profiles.role = MAINTENANCE_STAFF with name/phone and writes the STAFF_CREATE '
  'audit entry in one transaction. Called from the create-staff Edge Function after the '
  'Auth admin API creates auth.users. Requirements 5.3, 14.1, 14.4';

-- SECURITY DEFINER because the listing needs auth.users.email, which authenticated
-- callers cannot read directly.
create function public.list_staff(p_include_inactive boolean default true)
returns table (
  user_id uuid,
  email text,
  full_name text,
  phone text,
  is_active boolean,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_permission('STAFF_ACCOUNT_READ');

  return query
    select
      p.user_id,
      u.email::text,
      p.full_name,
      p.phone,
      p.is_active,
      u.created_at
    from public.profiles p
    join auth.users u on u.id = p.user_id
    where p.role = 'MAINTENANCE_STAFF'
      and (p_include_inactive or p.is_active)
    order by coalesce(p.full_name, u.email::text);
end;
$$;

comment on function public.list_staff(boolean) is
  'Administrator-only Maintenance_Staff listing with email from auth.users. '
  'Requirements 5.3, 7.2';

-- SECURITY INVOKER: an Administrator may already update profiles under RLS, so the
-- caller keeps their own visibility here.
create function public.set_staff_active(p_user_id uuid, p_active boolean)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_role public.role;
  v_was_active boolean;
  v_audit_id uuid;
begin
  perform public.require_permission('STAFF_ACCOUNT_MODIFY');

  if p_active is null then
    raise exception 'active flag is required' using errcode = '22023';
  end if;

  select role, is_active into v_role, v_was_active
    from public.profiles
   where user_id = p_user_id
     for update;

  if v_role is null then
    raise exception 'staff member % not found', p_user_id using errcode = 'P0002';
  end if;

  if v_role <> 'MAINTENANCE_STAFF' then
    raise exception 'user % is not a maintenance staff member', p_user_id using errcode = '22023';
  end if;

  if v_was_active = p_active then
    raise exception 'staff member is already %', case when p_active then 'active' else 'deactivated' end
      using errcode = '22023';
  end if;

  update public.profiles
     set is_active = p_active
   where user_id = p_user_id;

  v_audit_id := public.record_audit(
    case when p_active then 'STAFF_MODIFY' else 'STAFF_DEACTIVATE' end,
    'profiles',
    p_user_id,
    'is_active',
    v_was_active::text,
    p_active::text
  );

  if v_audit_id is null then
    raise exception 'failed to record audit entry for staff status change';
  end if;

  return jsonb_build_object(
    'user_id', p_user_id,
    'is_active', p_active
  );
end;
$$;

comment on function public.set_staff_active(uuid, boolean) is
  'Administrator-only activation toggle for Maintenance_Staff, with STAFF_DEACTIVATE / '
  'STAFF_MODIFY audit entry in the same transaction. Requirements 5.3, 14.1, 14.4';

-- Deactivation has to bite somewhere: a disabled staff member is no longer a valid
-- assignee (Requirement 7.2).
create or replace function public.assign_complaint(
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
    where user_id = p_staff_id and role = 'MAINTENANCE_STAFF' and is_active
  ) then
    raise exception 'assignee % is not an active maintenance staff member', p_staff_id
      using errcode = '22023';
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

grant execute on function public.create_staff_account(uuid, text, text) to authenticated, service_role;
grant execute on function public.list_staff(boolean) to authenticated, service_role;
grant execute on function public.set_staff_active(uuid, boolean) to authenticated, service_role;
