-- Migration: helper to configure the Vault secrets the notify cron needs
--
-- `invoke_notify` (schedule_cron_jobs) reads `project_url` and `service_role_key` from
-- Vault at run time so no credential is ever committed. Setting those values needs a
-- statement, not a migration constant, so this function accepts them as arguments and
-- is callable only by service_role. The values come from the operator's .env
-- (scripts/configure-notify.mjs); nothing secret lives in this file.

create or replace function public.configure_notify_vault(
  p_project_url text,
  p_service_role_key text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if coalesce(p_project_url, '') = '' or coalesce(p_service_role_key, '') = '' then
    raise exception 'project_url and service_role_key are both required'
      using errcode = '22023';
  end if;

  select id into v_id from vault.secrets where name = 'project_url';
  if v_id is null then
    perform vault.create_secret(p_project_url, 'project_url');
  else
    perform vault.update_secret(v_id, p_project_url);
  end if;

  select id into v_id from vault.secrets where name = 'service_role_key';
  if v_id is null then
    perform vault.create_secret(p_service_role_key, 'service_role_key');
  else
    perform vault.update_secret(v_id, p_service_role_key);
  end if;
end;
$$;

comment on function public.configure_notify_vault is
  'Stores the project URL and service-role key in Vault for invoke_notify (pg_cron -> '
  'pg_net). service_role only; values are supplied at run time so no credential is '
  'committed to a migration.';

revoke all on function public.configure_notify_vault(text, text) from public;
grant execute on function public.configure_notify_vault(text, text) to service_role;
