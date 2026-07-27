-- Migration: RLS policies for allotment + lease
-- Requirements 4.4, 4.8
-- Administrator: full access. Office_Owner: read-only access to their own rows.

alter table public.allotment enable row level security;
alter table public.lease enable row level security;

create policy allotment_all_admin on public.allotment
  for all to authenticated
  using (public.is_administrator())
  with check (public.is_administrator());

create policy allotment_select_owner on public.allotment
  for select to authenticated
  using (
    office_owner_id = (select id from public.office_owners where user_id = auth.uid())
  );

create policy lease_all_admin on public.lease
  for all to authenticated
  using (public.is_administrator())
  with check (public.is_administrator());

create policy lease_select_owner on public.lease
  for select to authenticated
  using (
    allotment_id in (
      select id from public.allotment
      where office_owner_id = (select id from public.office_owners where user_id = auth.uid())
    )
  );

revoke all on public.allotment, public.lease from anon;
grant select on public.allotment, public.lease to authenticated;
grant all on public.allotment, public.lease to service_role;
