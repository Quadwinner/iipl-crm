-- Migration: query_audit_log RPC
-- Requirement 14.2
-- Administrator-only read over audit_log_entries, filterable by acting user,
-- action type, and date range, with pagination. Returns for each entry the acting
-- user (id, email, role), action type, affected record id, entity type, timestamp,
-- and the field-level change detail recorded for modifications.

create function public.query_audit_log(
  p_actor_user_id uuid default null,
  p_action_type text default null,
  p_from_date timestamptz default null,
  p_to_date timestamptz default null,
  p_limit integer default 100,
  p_offset integer default 0
)
returns table (
  id uuid,
  actor_user_id uuid,
  actor_email text,
  actor_role public.role,
  action_type text,
  entity_type text,
  entity_id uuid,
  field_name text,
  old_value text,
  new_value text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_permission('AUDIT_READ');

  return query
    select
      e.id,
      e.actor_user_id,
      u.email::text,
      p.role,
      e.action_type,
      e.entity_type,
      e.entity_id,
      e.field_name,
      e.old_value,
      e.new_value,
      e.created_at
    from public.audit_log_entries e
    left join auth.users u on u.id = e.actor_user_id
    left join public.profiles p on p.user_id = e.actor_user_id
    where (p_actor_user_id is null or e.actor_user_id = p_actor_user_id)
      and (p_action_type is null or e.action_type = p_action_type)
      and (p_from_date is null or e.created_at >= p_from_date)
      and (p_to_date is null or e.created_at <= p_to_date)
    order by e.created_at desc
    limit greatest(coalesce(p_limit, 100), 0)
    offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

comment on function public.query_audit_log is
  'Administrator-only audit log query filterable by actor_user_id, action_type, and '
  'date range with limit/offset pagination; returns acting user (id/email/role), action '
  'type, entity type/id, timestamp, and field-level change detail. Requirement 14.2';

grant execute on function public.query_audit_log(uuid, text, timestamptz, timestamptz, integer, integer)
  to authenticated, service_role;
