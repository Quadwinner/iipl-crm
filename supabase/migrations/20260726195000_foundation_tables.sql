create table public.complaint_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 100),
  is_active boolean not null default true
);

insert into public.complaint_categories (name) values
  ('Electrical'), ('Plumbing'), ('HVAC'), ('Cleaning'),
  ('Security'), ('Internet'), ('Furniture'), ('Other');

create type public.notification_channel as enum ('EMAIL', 'SMS', 'IN_APP');
create type public.notification_status as enum ('PENDING', 'SENT', 'FAILED');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  channel public.notification_channel not null,
  notification_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status public.notification_status not null default 'PENDING',
  retry_count integer not null default 0 check (retry_count >= 0),
  next_attempt_at timestamptz not null default now(),
  last_attempt_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_pending_idx
  on public.notifications (status, next_attempt_at)
  where status = 'PENDING';

create function public.enqueue_notification(
  p_user_id uuid,
  p_channel public.notification_channel,
  p_type text,
  p_payload jsonb default '{}'::jsonb
)
returns uuid
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, channel, notification_type, payload)
  values (p_user_id, p_channel, p_type, p_payload)
  returning id;
$$;

create table public.audit_log_entries (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id) on delete set null,
  action_type text not null,
  entity_type text not null,
  entity_id uuid not null,
  field_name text,
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);

create index audit_log_actor_idx on public.audit_log_entries (actor_user_id, created_at desc);
create index audit_log_action_idx on public.audit_log_entries (action_type, created_at desc);
create index audit_log_entity_idx on public.audit_log_entries (entity_type, entity_id);

create function public.record_audit(
  p_action_type text,
  p_entity_type text,
  p_entity_id uuid,
  p_field_name text default null,
  p_old_value text default null,
  p_new_value text default null
)
returns uuid
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_log_entries (
    actor_user_id, action_type, entity_type, entity_id, field_name, old_value, new_value
  )
  values (auth.uid(), p_action_type, p_entity_type, p_entity_id, p_field_name, p_old_value, p_new_value)
  returning id;
$$;

create function public.configure_payment_grace_period(p_days integer)
returns public.global_config
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.global_config;
begin
  perform public.require_permission('CONFIG_MANAGE');

  if p_days is null or p_days < 0 then
    raise exception 'payment grace period must be a non-negative whole number of days'
      using errcode = '22023';
  end if;

  update public.global_config
     set payment_grace_period_days = p_days, updated_at = now()
   where id = 1
  returning * into v_row;

  return v_row;
end;
$$;

alter table public.complaint_categories enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_log_entries enable row level security;

create policy complaint_categories_select on public.complaint_categories
  for select to authenticated using (true);

create policy complaint_categories_write_admin on public.complaint_categories
  for all to authenticated
  using (public.is_administrator())
  with check (public.is_administrator());

create policy notifications_select_own on public.notifications
  for select to authenticated using (user_id = auth.uid());

create policy audit_log_select_admin on public.audit_log_entries
  for select to authenticated using (public.is_administrator());

revoke all on public.complaint_categories, public.notifications, public.audit_log_entries from anon;
grant select on public.complaint_categories to authenticated;
grant insert, update, delete on public.complaint_categories to authenticated;
grant select on public.notifications to authenticated;
-- Append-only: no update/delete grants anywhere (Requirement 14.3).
grant select, insert on public.audit_log_entries to authenticated;
grant all on public.complaint_categories, public.notifications to service_role;
grant select, insert on public.audit_log_entries to service_role;

grant execute on function public.enqueue_notification(uuid, public.notification_channel, text, jsonb)
  to authenticated, service_role;
grant execute on function public.record_audit(text, text, uuid, text, text, text)
  to authenticated, service_role;
grant execute on function public.configure_payment_grace_period(integer)
  to authenticated, service_role;
