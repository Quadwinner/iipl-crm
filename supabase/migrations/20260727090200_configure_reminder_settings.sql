-- Migration: configure_reminder_settings RPC
-- Requirements 11.6, 11.9
-- Admin-only RPC that validates reminder_lead_time_days / reminder_frequency_days as
-- positive whole numbers before updating the existing single-row global_config (created
-- in Task 3.1). Rejects non-positive values with a descriptive error. The integer
-- parameter type rejects non-whole-number input at the call boundary.

create function public.configure_reminder_settings(
  p_lead_time_days integer,
  p_frequency_days integer
)
returns public.global_config
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.global_config;
begin
  perform public.require_permission('CONFIG_MANAGE');

  if p_lead_time_days is null or p_lead_time_days <= 0 then
    raise exception 'reminder lead time must be a positive whole number of days'
      using errcode = '22023';
  end if;

  if p_frequency_days is null or p_frequency_days <= 0 then
    raise exception 'reminder frequency must be a positive whole number of days'
      using errcode = '22023';
  end if;

  update public.global_config
     set reminder_lead_time_days = p_lead_time_days,
         reminder_frequency_days = p_frequency_days,
         updated_at = now()
   where id = 1
  returning * into v_row;

  return v_row;
end;
$$;

comment on function public.configure_reminder_settings(integer, integer) is
  'Admin-only update of reminder_lead_time_days and reminder_frequency_days in '
  'global_config; rejects non-positive values. Requirements 11.6, 11.9';

grant execute on function public.configure_reminder_settings(integer, integer)
  to authenticated, service_role;
