create table public.global_config (
  id smallint primary key default 1 check (id = 1),
  session_timeout_minutes integer not null default 30 check (session_timeout_minutes > 0),
  lockout_threshold integer not null default 5 check (lockout_threshold > 0),
  lockout_duration_minutes integer not null default 15 check (lockout_duration_minutes > 0),
  reminder_lead_time_days integer not null default 7 check (reminder_lead_time_days > 0),
  reminder_frequency_days integer not null default 3 check (reminder_frequency_days > 0),
  payment_grace_period_days integer not null default 5 check (payment_grace_period_days >= 0),
  max_retries integer not null default 3 check (max_retries > 0),
  updated_at timestamptz not null default now()
);

insert into public.global_config (id) values (1);

create function public.config()
returns public.global_config
language sql
stable
security definer
set search_path = ''
as $$
  select * from public.global_config where id = 1;
$$;

alter table public.global_config enable row level security;

create policy global_config_select on public.global_config
  for select to authenticated
  using (true);

create policy global_config_update_admin on public.global_config
  for update to authenticated
  using (public.is_administrator())
  with check (public.is_administrator());

revoke all on public.global_config from anon;
grant select on public.global_config to authenticated;
grant update on public.global_config to authenticated;
grant all on public.global_config to service_role;
grant execute on function public.config() to authenticated, service_role;
