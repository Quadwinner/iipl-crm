-- Migration: add_comment RPC
-- Requirement 7.5
-- Company_Staff (Administrator or Maintenance_Staff) appends a COMMENT event (up to
-- 2000 chars) to a complaint's history without mutating any prior entry.

create function public.add_comment(
  p_complaint_id uuid,
  p_comment text
)
returns public.complaint_event
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.complaint_event;
begin
  -- COMPLAINT_RESOLVE is held by ADMINISTRATOR and MAINTENANCE_STAFF only.
  perform public.require_permission('COMPLAINT_RESOLVE');

  if p_comment is null or char_length(p_comment) < 1 or char_length(p_comment) > 2000 then
    raise exception 'comment must be between 1 and 2000 characters' using errcode = '22023';
  end if;

  if not exists (select 1 from public.maintenance_complaint where id = p_complaint_id) then
    raise exception 'complaint % not found', p_complaint_id using errcode = 'P0002';
  end if;

  insert into public.complaint_event (complaint_id, actor_user_id, event_type, comment_text)
  values (p_complaint_id, auth.uid(), 'COMMENT', p_comment)
  returning * into v_event;

  return v_event;
end;
$$;

comment on function public.add_comment is
  'Appends a COMMENT complaint_event (append-only) for Company_Staff. Requirement 7.5';

grant execute on function public.add_comment(uuid, text) to authenticated, service_role;
