-- Migration: submit_complaint RPC
-- Requirements 6.1, 6.4, 6.5
-- Office_Owner submits a complaint for a unit currently allotted to them, with a
-- category from the configured active list and a 1-2000 char description. On any
-- validation failure the transaction aborts and no complaint row is created.
-- Attachment handling is wired later in Task 12.

create function public.submit_complaint(
  p_office_unit_id uuid,
  p_category text,
  p_description text
)
returns public.maintenance_complaint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
  v_complaint public.maintenance_complaint;
begin
  perform public.require_permission('COMPLAINT_SUBMIT');

  v_owner_id := public.current_office_owner_id();
  if v_owner_id is null then
    raise exception 'no office owner record for the current user' using errcode = '42501';
  end if;

  if p_description is null or char_length(p_description) < 1 or char_length(p_description) > 2000 then
    raise exception 'description must be between 1 and 2000 characters' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.complaint_categories
    where name = p_category and is_active
  ) then
    raise exception 'category % is not in the configured list', p_category using errcode = '22023';
  end if;

  -- The unit must be currently allotted to the submitting owner (active allotment).
  if not exists (
    select 1 from public.allotment
    where office_unit_id = p_office_unit_id
      and office_owner_id = v_owner_id
      and status = 'ACTIVE'
  ) then
    raise exception 'office unit % is not currently allotted to you', p_office_unit_id
      using errcode = '42501';
  end if;

  insert into public.maintenance_complaint (office_unit_id, office_owner_id, category, description, status)
  values (p_office_unit_id, v_owner_id, p_category, p_description, 'OPEN')
  returning * into v_complaint;

  return v_complaint;
end;
$$;

comment on function public.submit_complaint is
  'Office_Owner submits a Maintenance_Complaint (status OPEN) for a unit actively '
  'allotted to them, validating category and description. Requirements 6.1, 6.4, 6.5';

grant execute on function public.submit_complaint(uuid, text, text) to authenticated, service_role;
