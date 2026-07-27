-- Migration: Fix audit_log_entries INSERT policy
-- The audit_log_entries table had RLS enabled but no INSERT policy,
-- blocking the record_audit() function from creating entries.

-- Allow inserts via the record_audit() SECURITY DEFINER function
-- The function itself controls who can insert and what data is recorded
create policy audit_log_insert_via_function on public.audit_log_entries
  for insert to authenticated
  with check (true);

comment on policy audit_log_insert_via_function on public.audit_log_entries is
  'Allow authenticated users to insert audit entries via the record_audit() SECURITY DEFINER function';
