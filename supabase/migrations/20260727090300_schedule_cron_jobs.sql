-- Migration: scheduled jobs (pg_cron) + notify Edge Function invocation (pg_net)
-- Requirements 3.5, 8.1, 8.4, 11.1, 11.2, 11.7
--
-- Enables pg_cron and pg_net and schedules the daily time-based behaviour:
--   * run_billing_cycle_job   — generate invoices for due billing cycles (8.1)
--   * mark_overdue_job        — flip past-due unpaid invoices to OVERDUE (8.4)
--   * run_lease_expiry_job    — auto-expire allotments past their lease end_date (3.5)
--   * send_reminder_job       — enqueue rent reminders (11.1, 11.2, 11.7)
--   * invoke_notify           — poll + deliver the notification queue via the notify
--                               Edge Function (called over HTTP with pg_net)
--
-- SECRET HANDLING: the notify Edge Function is invoked with the project URL and the
-- service-role key. These are NOT hardcoded here. They are read at run time from Supabase
-- Vault (vault.decrypted_secrets). After this migration is applied, an operator must store
-- the two secrets once (values come from the project's API settings, never committed):
--
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('<service-role-key>', 'service_role_key');
--
-- Until both secrets exist, invoke_notify logs a notice and no-ops (the cron job does not
-- error), so applying this migration is safe before the secrets are configured.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Auto-expire allotments whose lease end_date has passed while still ACTIVE (Requirement 3.5).
-- Delegates to transition_allotment so occupancy flips to VACANT and the audit entry is
-- written atomically. Each allotment is isolated in its own subtransaction so one failure
-- does not abort the rest of the run. Runs with the service role from cron (auth.uid() is
-- null), which transition_allotment treats as the trusted scheduler.
create function public.run_lease_expiry_job(p_as_of date default current_date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_allotment_id uuid;
  v_expired integer := 0;
begin
  if auth.uid() is not null and not public.is_administrator() then
    raise exception 'permission denied: lease expiry job requires Administrator or system role'
      using errcode = '42501';
  end if;

  for v_allotment_id in
    select a.id
      from public.allotment a
      join public.lease l on l.allotment_id = a.id
     where a.status = 'ACTIVE'
       and l.end_date <= p_as_of
  loop
    begin
      perform public.transition_allotment(v_allotment_id, 'EXPIRED', 'LEASE_END_REACHED');
      v_expired := v_expired + 1;
    exception
      when others then
        -- Isolate the failure to this allotment; the rest of the run continues.
        continue;
    end;
  end loop;

  return v_expired;
end;
$$;

comment on function public.run_lease_expiry_job is
  'Auto-expires ACTIVE allotments whose lease end_date has passed via transition_allotment. '
  'Requirement 3.5';

grant execute on function public.run_lease_expiry_job(date) to authenticated, service_role;

-- Invokes the notify Edge Function over HTTP using pg_net. Reads the project URL and
-- service-role key from Vault so no secret literal is committed. No-ops with a notice when
-- the secrets are not yet configured.
create function public.invoke_notify()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_key text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'service_role_key';

  if v_url is null or v_key is null then
    raise notice 'invoke_notify: project_url/service_role_key not configured in Vault; skipping';
    return;
  end if;

  perform net.http_post(
    url := v_url || '/functions/v1/notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := '{}'::jsonb
  );
end;
$$;

comment on function public.invoke_notify is
  'Calls the notify Edge Function via pg_net, reading project_url/service_role_key from '
  'Vault. Scheduled by pg_cron.';

-- Delivery is a privileged system job; keep it off anon/authenticated.
revoke all on function public.invoke_notify() from public;
grant execute on function public.invoke_notify() to service_role;

-- Daily schedules (UTC). cron.schedule upserts by job name, so re-running is safe.
select cron.schedule('run-billing-cycle-daily', '0 1 * * *', $$select public.run_billing_cycle_job();$$);
select cron.schedule('mark-overdue-daily', '30 1 * * *', $$select public.mark_overdue_job();$$);
select cron.schedule('lease-expiry-daily', '0 2 * * *', $$select public.run_lease_expiry_job();$$);
select cron.schedule('send-reminders-daily', '30 2 * * *', $$select public.send_reminder_job();$$);

-- Deliver the notification queue frequently so retries/backoff progress promptly.
select cron.schedule('deliver-notifications', '*/5 * * * *', $$select public.invoke_notify();$$);
