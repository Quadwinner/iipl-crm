-- Migration: Add INSERT policy for audit_log_entries
-- The table had RLS enabled with grants but no INSERT policy, blocking all audit writes

-- Allow authenticated users to insert audit entries
-- This policy permits inserts called via record_audit() or direct service operations
create policy audit_log_insert_authenticated on public.audit_log_entries
  for insert to authenticated
  with check (true);

comment on policy audit_log_insert_authenticated on public.audit_log_entries is
  'Authenticated users can insert audit entries via record_audit() function. Append-only table (no UPDATE/DELETE grants).';
