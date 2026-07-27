-- Migration: show an Office_Owner who their complaint is assigned to, by name
-- Requirements 6.2, 6.3, 4.4, 4.8
--
-- An owner cannot read a staff member's profiles row (RLS), so a name can never be
-- resolved by a plain join from an owner-scoped SECURITY INVOKER query. Two additions:
--   * actor_display_name(uuid) - SECURITY DEFINER lookup that returns *only* a display
--     name, never an email, phone, or auth metadata.
--   * get_complaint_history(uuid) - per-complaint history with actor names, authorized
--     for Company_Staff or the owner who raised that complaint.

-- Privacy boundary: the only column this exposes is a display name. Company_Staff fall
-- back to a neutral label so the UI never renders a blank cell or a raw uuid; other
-- actors are labelled by role only, so owner identities are not enumerable by uuid.
create function public.actor_display_name(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p.role in ('ADMINISTRATOR', 'MAINTENANCE_STAFF') then coalesce(p.full_name, 'IIPL staff')
    else 'Office owner'
  end
  from public.profiles p
  where p.user_id = p_user_id;
$$;

comment on function public.actor_display_name(uuid) is
  'Display name for a user id, with a neutral fallback. Exposes no email, phone, or user '
  'metadata. Requirements 6.2, 6.3';

-- create or replace cannot add a column to a returns table, so the function is dropped
-- and recreated. Nothing else references it.
drop function if exists public.list_complaints_for_owner();

create function public.list_complaints_for_owner()
returns table (
  id uuid,
  office_unit_id uuid,
  unit_code text,
  building_name text,
  office_owner_id uuid,
  owner_name text,
  category text,
  description text,
  status public.complaint_status,
  assigned_to uuid,
  assigned_to_name text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    c.id,
    c.office_unit_id,
    u.unit_code,
    b.name::text,
    c.office_owner_id,
    o.name::text,
    c.category,
    c.description,
    c.status,
    c.assigned_to,
    -- null only when unassigned; a nameless assignee still gets the neutral label, and
    -- the row itself is never dropped for want of a name.
    case
      when c.assigned_to is null then null
      else coalesce(public.actor_display_name(c.assigned_to), 'IIPL staff')
    end,
    c.created_at,
    c.updated_at
  from public.maintenance_complaint c
  join public.office_unit u on u.id = c.office_unit_id
  join public.building b on b.id = u.building_id
  join public.office_owners o on o.id = c.office_owner_id
  where c.office_owner_id = public.current_office_owner_id()
  order by c.created_at desc;
$$;

comment on function public.list_complaints_for_owner is
  'Owner-scoped complaint list (resolved from auth.uid()) including the assignee display '
  'name. Requirements 6.2, 6.3, 4.4, 4.8';

-- SECURITY DEFINER so the acting user's display name can be resolved past the caller's
-- own profiles visibility. Authorization is therefore checked here, first, before any
-- history row is read.
create function public.get_complaint_history(p_complaint_id uuid)
returns table (
  id uuid,
  event_type public.event_type,
  old_status public.complaint_status,
  new_status public.complaint_status,
  comment_text text,
  created_at timestamptz,
  actor_user_id uuid,
  actor_name text,
  actor_role public.role
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_office_owner_id uuid;
begin
  select c.office_owner_id into v_office_owner_id
    from public.maintenance_complaint c
   where c.id = p_complaint_id;

  if not (
    public.current_role() in ('ADMINISTRATOR', 'MAINTENANCE_STAFF')
    or (v_office_owner_id is not null
        and v_office_owner_id = public.current_office_owner_id())
  ) then
    raise exception 'permission denied: complaint history is restricted to company staff and the owner who raised the complaint'
      using errcode = '42501';
  end if;

  return query
    select
      e.id,
      e.event_type,
      e.old_status,
      e.new_status,
      e.comment_text,
      e.created_at,
      e.actor_user_id,
      case
        when e.actor_user_id is null then null
        else coalesce(public.actor_display_name(e.actor_user_id), 'IIPL staff')
      end,
      p.role
    from public.complaint_event e
    left join public.profiles p on p.user_id = e.actor_user_id
    where e.complaint_id = p_complaint_id
    order by e.created_at;
end;
$$;

comment on function public.get_complaint_history(uuid) is
  'Status/comment history for one complaint with the acting user display name. Readable '
  'by Company_Staff or the owner who raised it, otherwise raises 42501. '
  'Requirements 6.3, 7.5, 4.4, 4.8';

grant execute on function public.actor_display_name(uuid) to authenticated, service_role;
grant execute on function public.list_complaints_for_owner() to authenticated, service_role;
grant execute on function public.get_complaint_history(uuid) to authenticated, service_role;
