-- Migration: create_owner_account Postgres function
-- Requirement 4.1, 4.2, 4.3, 14.1
-- Atomically creates profiles + office_owners + audit log entry + notification

create function public.create_owner_account(
  p_auth_user_id uuid,
  p_name varchar(100),
  p_contact_email varchar(255),
  p_phone varchar(15)
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
  v_profile_exists boolean;
begin
  -- Validate inputs (Requirements 4.1, 4.3)
  if p_name is null or char_length(p_name) not between 1 and 100 then
    raise exception 'name must be 1-100 characters'
      using errcode = '22023';
  end if;

  if p_contact_email is null or p_contact_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then
    raise exception 'invalid email format'
      using errcode = '22023';
  end if;

  if p_phone is null or char_length(p_phone) not between 10 and 15 or p_phone !~ '^\d+$' then
    raise exception 'phone must be 10-15 digits'
      using errcode = '22023';
  end if;

  -- Check email uniqueness (Requirement 4.2)
  if exists (select 1 from public.office_owners where contact_email = p_contact_email) then
    raise exception 'contact email already exists'
      using errcode = '23505';
  end if;

  -- Check if profile already exists (from auth trigger)
  select exists (
    select 1 from public.profiles where user_id = p_auth_user_id
  ) into v_profile_exists;

  -- Create or update profile with OFFICE_OWNER role
  if v_profile_exists then
    update public.profiles
       set role = 'OFFICE_OWNER',
           last_activity_at = now()
     where user_id = p_auth_user_id;
  else
    insert into public.profiles (user_id, role)
    values (p_auth_user_id, 'OFFICE_OWNER');
  end if;

  -- Create office_owners row
  insert into public.office_owners (user_id, name, contact_email, phone, status)
  values (p_auth_user_id, p_name, p_contact_email, p_phone, 'ACTIVE')
  returning id into v_owner_id;

  -- Record audit log entry (Requirement 14.1)
  -- If this fails, the entire transaction rolls back (Requirement 14.4)
  perform public.record_audit(
    'OWNER_CREATE',
    'office_owner',
    v_owner_id,
    null,
    null,
    null
  );

  -- Enqueue login-instructions notification (Requirement 4.1)
  perform public.enqueue_notification(
    p_auth_user_id,
    'EMAIL',
    'LOGIN_INSTRUCTIONS',
    jsonb_build_object(
      'owner_id', v_owner_id,
      'name', p_name,
      'contact_email', p_contact_email
    )
  );

  -- Return the created owner details
  return jsonb_build_object(
    'owner_id', v_owner_id,
    'user_id', p_auth_user_id,
    'name', p_name,
    'contact_email', p_contact_email,
    'phone', p_phone,
    'status', 'ACTIVE'
  );
end;
$$;

comment on function public.create_owner_account is
  'Atomically creates profiles + office_owners + audit log + notification. '
  'Called from Edge Function after Supabase Auth admin API creates auth.users. '
  'Requirements 4.1, 4.2, 4.3, 14.1, 14.4';

-- Grant execute to service_role only (Edge Functions use service_role)
grant execute on function public.create_owner_account(uuid, varchar, varchar, varchar)
  to service_role;
