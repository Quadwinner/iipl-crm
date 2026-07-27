-- Migration: Fix audit record error handling in update_owner_profile
-- Replace the function to use proper error handling for audit logging

create or replace function public.update_owner_profile(
  p_name varchar default null,
  p_contact_email varchar default null,
  p_phone varchar default null
)
returns public.office_owners
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
  v_old_name varchar;
  v_old_email varchar;
  v_old_phone varchar;
  v_updated_owner public.office_owners;
  v_audit_id uuid;
begin
  -- Resolve office_owner_id from auth.uid() server-side (never client-supplied)
  select id, name, contact_email, phone
    into v_owner_id, v_old_name, v_old_email, v_old_phone
    from public.office_owners
   where user_id = auth.uid()
     for update;

  if v_owner_id is null then
    raise exception 'no office owner record found for current user'
      using errcode = '22023';
  end if;

  -- Validate name: 1-100 characters
  if p_name is not null then
    if char_length(p_name) < 1 or char_length(p_name) > 100 then
      raise exception 'name must be between 1 and 100 characters'
        using errcode = '22023';
    end if;
  end if;

  -- Validate email format (basic check for @)
  if p_contact_email is not null then
    if p_contact_email !~ '^[^@]+@[^@]+\.[^@]+$' then
      raise exception 'invalid email format'
        using errcode = '22023';
    end if;

    -- Check email uniqueness (exclude current owner)
    if exists (
      select 1 from public.office_owners
       where contact_email = p_contact_email
         and id != v_owner_id
    ) then
      raise exception 'email already exists on another account'
        using errcode = '23505';
    end if;
  end if;

  -- Validate phone: 10-15 digits
  if p_phone is not null then
    if char_length(p_phone) < 10 or char_length(p_phone) > 15 then
      raise exception 'phone number must be between 10 and 15 digits'
        using errcode = '22023';
    end if;
  end if;

  -- Update office_owners record (only fields that were provided)
  update public.office_owners
     set name = coalesce(p_name, name),
         contact_email = coalesce(p_contact_email, contact_email),
         phone = coalesce(p_phone, phone),
         updated_at = now()
   where id = v_owner_id
  returning * into v_updated_owner;

  -- Insert audit log entries for each changed field (Requirement 14.1)
  if p_name is not null and p_name is distinct from v_old_name then
    v_audit_id := public.record_audit(
      'OWNER_MODIFY',
      'office_owner',
      v_owner_id,
      'name',
      v_old_name,
      p_name
    );
    if v_audit_id is null then
      raise exception 'failed to create audit entry for name change';
    end if;
  end if;

  if p_contact_email is not null and p_contact_email is distinct from v_old_email then
    v_audit_id := public.record_audit(
      'OWNER_MODIFY',
      'office_owner',
      v_owner_id,
      'contact_email',
      v_old_email,
      p_contact_email
    );
    if v_audit_id is null then
      raise exception 'failed to create audit entry for email change';
    end if;
  end if;

  if p_phone is not null and p_phone is distinct from v_old_phone then
    v_audit_id := public.record_audit(
      'OWNER_MODIFY',
      'office_owner',
      v_owner_id,
      'phone',
      v_old_phone,
      p_phone
    );
    if v_audit_id is null then
      raise exception 'failed to create audit entry for phone change';
    end if;
  end if;

  return v_updated_owner;
end;
$$;

comment on function public.update_owner_profile is
  'Self-service profile update for office owners. Validates format, checks email uniqueness, and writes audit entries atomically.';
