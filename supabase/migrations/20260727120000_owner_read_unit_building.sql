-- Migration: let an Office_Owner read the Office_Units and Buildings they are allotted
-- Requirements 4.4, 4.8, 6.2, 6.3, 8.3
--
-- Task 5.8 granted read on office_unit/building to Administrator and Maintenance_Staff
-- only. Owners were never included, but the Owner_Portal has to show the unit code and
-- building for their own complaints, invoices, and allotments. Two consequences were
-- visible: the complaint form's unit picker rendered "— · —" because the nested join
-- resolved to null, and list_complaints_for_owner returned zero rows because it is
-- SECURITY INVOKER and INNER JOINs office_unit/building, so the blocked joins removed
-- every row even though the complaints themselves were readable.
--
-- Scope stays tight: an owner sees only units tied to one of their own allotments (any
-- status, so terminated history still renders), and only the buildings containing those
-- units. Owner identity is resolved server-side from auth.uid(); no client-supplied id is
-- trusted. Read-only — the Administrator write policies are untouched.

create policy office_unit_select_owner
  on public.office_unit
  for select
  to authenticated
  using (
    exists (
      select 1
        from public.allotment a
       where a.office_unit_id = public.office_unit.id
         and a.office_owner_id = public.current_office_owner_id()
    )
  );

comment on policy office_unit_select_owner on public.office_unit is
  'An Office_Owner may read the Office_Units they hold or have held an Allotment on, so '
  'the Owner_Portal can show unit codes. Requirements 4.4, 6.2, 8.3';

create policy building_select_owner
  on public.building
  for select
  to authenticated
  using (
    exists (
      select 1
        from public.office_unit u
        join public.allotment a on a.office_unit_id = u.id
       where u.building_id = public.building.id
         and a.office_owner_id = public.current_office_owner_id()
    )
  );

comment on policy building_select_owner on public.building is
  'An Office_Owner may read the Buildings containing their allotted Office_Units. '
  'Requirements 4.4, 6.2, 8.3';
