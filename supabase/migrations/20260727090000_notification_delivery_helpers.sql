-- Migration: notification delivery helpers (support for the notify Edge Function, Task 20.1)
-- Requirements 10.3, 10.4, 11.3, 11.8
-- The notify Edge Function polls pending notifications, sends each via the configured
-- EMAIL/SMS provider, and records the outcome. The retry policy (backoff + max_retries)
-- lives here in the database so it stays authoritative regardless of the caller.

-- Returns the notifications that are due for a delivery attempt, with the recipient's
-- email and phone resolved server-side (never trusted from the payload). SECURITY DEFINER
-- so it can read auth.users and office_owners past the caller's RLS visibility; only the
-- service_role (used by the Edge Function) is granted execute.
create function public.pending_notifications(p_limit integer default 100)
returns table (
  id uuid,
  user_id uuid,
  channel public.notification_channel,
  notification_type text,
  payload jsonb,
  retry_count integer,
  recipient_email text,
  recipient_phone text
)
language sql
security definer
set search_path = ''
as $$
  select
    n.id,
    n.user_id,
    n.channel,
    n.notification_type,
    n.payload,
    n.retry_count,
    coalesce(o.contact_email, u.email) as recipient_email,
    o.phone as recipient_phone
  from public.notifications n
  left join public.office_owners o on o.user_id = n.user_id
  left join auth.users u on u.id = n.user_id
  where n.status = 'PENDING'
    and n.next_attempt_at <= now()
  order by n.next_attempt_at
  limit greatest(p_limit, 1);
$$;

-- Records the outcome of a single delivery attempt, applying the shared retry policy
-- (Requirement 10.4, 11.8). On success the notification is marked SENT. On failure the
-- retry_count is incremented; once it reaches global_config.max_retries the notification
-- is marked FAILED, otherwise it stays PENDING with an exponential-backoff next_attempt_at.
create function public.record_notification_attempt(p_id uuid, p_success boolean)
returns public.notifications
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max_retries integer;
  v_new_retry_count integer;
  v_backoff_minutes integer;
  v_row public.notifications;
begin
  select max_retries into v_max_retries from public.global_config where id = 1;

  if p_success then
    update public.notifications
       set status = 'SENT',
           last_attempt_at = now()
     where id = p_id
    returning * into v_row;
    return v_row;
  end if;

  select retry_count + 1 into v_new_retry_count
    from public.notifications
   where id = p_id;

  if v_new_retry_count is null then
    raise exception 'notification % not found', p_id using errcode = 'P0002';
  end if;

  if v_new_retry_count >= v_max_retries then
    update public.notifications
       set status = 'FAILED',
           retry_count = v_new_retry_count,
           last_attempt_at = now()
     where id = p_id
    returning * into v_row;
    return v_row;
  end if;

  -- Exponential backoff capped at one hour: 2^retry_count minutes.
  v_backoff_minutes := least(60, power(2, v_new_retry_count)::integer);

  update public.notifications
     set retry_count = v_new_retry_count,
         last_attempt_at = now(),
         next_attempt_at = now() + make_interval(mins => v_backoff_minutes)
   where id = p_id
  returning * into v_row;

  return v_row;
end;
$$;

comment on function public.pending_notifications(integer) is
  'Returns PENDING notifications due for delivery with recipient email/phone resolved '
  'server-side. Consumed by the notify Edge Function. Requirements 10.3, 11.3';

comment on function public.record_notification_attempt(uuid, boolean) is
  'Applies the shared retry policy to a delivery attempt: SENT on success; FAILED once '
  'global_config.max_retries is exhausted, otherwise PENDING with exponential backoff. '
  'Requirements 10.4, 11.8';

-- Delivery is a system job driven by the service role only; keep these out of anon/authenticated.
revoke all on function public.pending_notifications(integer) from public;
revoke all on function public.record_notification_attempt(uuid, boolean) from public;
grant execute on function public.pending_notifications(integer) to service_role;
grant execute on function public.record_notification_attempt(uuid, boolean) to service_role;
