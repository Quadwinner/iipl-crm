-- Migration: RLS policies for invoice
-- Requirements 4.4, 4.8
-- Administrator: full access. Office_Owner: read-only access to their own invoices.
-- Invoices are written only by the SECURITY DEFINER billing/payment functions, so
-- authenticated users get SELECT only.

alter table public.invoice enable row level security;

create policy invoice_all_admin on public.invoice
  for all to authenticated
  using (public.is_administrator())
  with check (public.is_administrator());

create policy invoice_select_owner on public.invoice
  for select to authenticated
  using (
    office_owner_id = (select id from public.office_owners where user_id = auth.uid())
  );

revoke all on public.invoice from anon;
grant select on public.invoice to authenticated;
grant all on public.invoice to service_role;
