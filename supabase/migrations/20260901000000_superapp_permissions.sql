-- Migration: superapp permission keys
-- Adds the three permissions the superapp layer needs. Rental permissions are
-- untouched; this only appends rows to the existing role_permissions table so
-- authorize()/require_permission() cover content and lead management too.

insert into public.role_permissions (permission_key, role) values
  ('CONTENT_MANAGE', 'ADMINISTRATOR'),
  ('LEAD_READ', 'ADMINISTRATOR'),
  ('LEAD_MANAGE', 'ADMINISTRATOR')
on conflict (permission_key, role) do nothing;
