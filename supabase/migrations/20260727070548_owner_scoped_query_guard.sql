-- Migration: Owner-scoped query guard pattern
-- Task 6.8: Implement owner-scoped query guard pattern
-- Requirements 4.4, 4.8: Owner data isolation

-- Helper function that resolves the office_owner_id for the authenticated caller.
-- Returns the id from public.office_owners for the current auth.uid(), or NULL
-- if no matching office_owner exists.
--
-- This function is used in RLS policies and RPCs to ensure owner-scoped queries
-- always use the server-resolved id, never a client-supplied id.
--
-- STABLE: result won't change within a transaction for the same auth.uid()
-- SECURITY INVOKER: caller's permissions apply (RLS still enforced)
-- search_path = '': fully qualified references to prevent search_path hijacking
create function public.current_office_owner_id()
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select id from public.office_owners where user_id = auth.uid();
$$;

-- Grant execute to authenticated users (needed for RLS policies and client RPCs)
-- and service_role (needed for system jobs that act on behalf of owners)
grant execute on function public.current_office_owner_id() to authenticated, service_role;

comment on function public.current_office_owner_id() is 
  'Returns the office_owner.id for the authenticated user, or NULL if the user is not an office owner. Used in RLS policies and RPCs to ensure owner-scoped queries always use server-resolved id.';
