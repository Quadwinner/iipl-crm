-- Migration: RLS policies for payment and payment_verification_failures
-- Task 16.11
-- Requirements 4.4, 4.8
-- Administrator: full access. Office_Owner: read-only access to their own payments.
-- Payments are written only by the SECURITY DEFINER initiate_payment / handle_payment_callback
-- functions, so authenticated users get SELECT only.

alter table public.payment enable row level security;

create policy payment_all_admin on public.payment
  for all to authenticated
  using (public.is_administrator())
  with check (public.is_administrator());

create policy payment_select_owner on public.payment
  for select to authenticated
  using (
    office_owner_id = (select id from public.office_owners where user_id = auth.uid())
  );

revoke all on public.payment from anon;
grant select on public.payment to authenticated;
grant all on public.payment to service_role;

-- Verification failures are an operational/security record: Administrator read-only,
-- written only by the webhook Edge Functions (service role). No owner access.
alter table public.payment_verification_failures enable row level security;

create policy payment_verification_failures_select_admin on public.payment_verification_failures
  for select to authenticated
  using (public.is_administrator());

revoke all on public.payment_verification_failures from anon;
grant select on public.payment_verification_failures to authenticated;
grant all on public.payment_verification_failures to service_role;
