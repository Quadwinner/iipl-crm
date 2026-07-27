-- Migration: RLS policies for maintenance_complaint + complaint_event
-- Requirements 4.4, 4.8, 5.4
-- Office_Owner: own complaints only. Maintenance_Staff: read all, update assigned.
-- Administrator: full access. Writes flow through SECURITY DEFINER RPCs; these
-- policies govern direct client reads and the staff update path.

alter table public.maintenance_complaint enable row level security;
alter table public.complaint_event enable row level security;

-- maintenance_complaint
create policy maintenance_complaint_all_admin on public.maintenance_complaint
  for all to authenticated
  using (public.is_administrator())
  with check (public.is_administrator());

create policy maintenance_complaint_select_owner on public.maintenance_complaint
  for select to authenticated
  using (office_owner_id = public.current_office_owner_id());

create policy maintenance_complaint_select_staff on public.maintenance_complaint
  for select to authenticated
  using (public.current_role() = 'MAINTENANCE_STAFF');

create policy maintenance_complaint_update_staff_assigned on public.maintenance_complaint
  for update to authenticated
  using (public.current_role() = 'MAINTENANCE_STAFF' and assigned_to = auth.uid())
  with check (public.current_role() = 'MAINTENANCE_STAFF' and assigned_to = auth.uid());

-- complaint_event
create policy complaint_event_all_admin on public.complaint_event
  for all to authenticated
  using (public.is_administrator())
  with check (public.is_administrator());

create policy complaint_event_select_owner on public.complaint_event
  for select to authenticated
  using (
    complaint_id in (
      select id from public.maintenance_complaint
      where office_owner_id = public.current_office_owner_id()
    )
  );

create policy complaint_event_select_staff on public.complaint_event
  for select to authenticated
  using (public.current_role() = 'MAINTENANCE_STAFF');

revoke all on public.maintenance_complaint, public.complaint_event from anon;
grant select on public.maintenance_complaint to authenticated;
grant all on public.maintenance_complaint to service_role;
-- Append-only history: no update/delete grants (Requirement 7.5).
grant select on public.complaint_event to authenticated;
grant select, insert on public.complaint_event to service_role;
