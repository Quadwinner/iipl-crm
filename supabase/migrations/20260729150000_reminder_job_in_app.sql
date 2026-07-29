-- Scheduled reminders also enqueue an in-app notification for the owner portal.

create or replace function public.send_reminder_job(p_as_of date default current_date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lead_time integer;
  v_frequency integer;
  v_inv record;
  v_current public.invoice_status;
  v_last_reminder date;
  v_owner_user_id uuid;
  v_owner_phone text;
  v_type text;
  v_payload jsonb;
  v_enqueued integer := 0;
begin
  if auth.uid() is not null and not public.is_administrator() then
    raise exception 'permission denied: reminder job requires Administrator or system role'
      using errcode = '42501';
  end if;

  select reminder_lead_time_days, reminder_frequency_days
    into v_lead_time, v_frequency
    from public.global_config
   where id = 1;

  for v_inv in
    select i.id,
           i.office_owner_id,
           i.due_date,
           i.total_amount
      from public.invoice i
     where i.status = 'OVERDUE'
        or (
             i.status in ('DUE', 'PARTIALLY_PAID')
             and i.due_date >= p_as_of
             and i.due_date <= p_as_of + v_lead_time
           )
  loop
    select status into v_current from public.invoice where id = v_inv.id;

    if v_current = 'PAID' then
      continue;
    end if;

    if v_current = 'OVERDUE' then
      v_type := 'REMINDER_OVERDUE';
    elsif v_current in ('DUE', 'PARTIALLY_PAID')
          and v_inv.due_date >= p_as_of
          and v_inv.due_date <= p_as_of + v_lead_time then
      v_type := 'REMINDER_UPCOMING';
    else
      continue;
    end if;

    select max(created_at)::date into v_last_reminder
      from public.notifications
     where notification_type in ('REMINDER_UPCOMING', 'REMINDER_OVERDUE')
       and (payload ->> 'invoice_id')::uuid = v_inv.id;

    if v_last_reminder is not null and (p_as_of - v_last_reminder) < v_frequency then
      continue;
    end if;

    select user_id, phone into v_owner_user_id, v_owner_phone
      from public.office_owners
     where id = v_inv.office_owner_id;

    if v_owner_user_id is null then
      continue;
    end if;

    v_payload := jsonb_build_object(
      'invoice_id', v_inv.id,
      'due_date', v_inv.due_date,
      'amount', v_inv.total_amount,
      'amount_due', v_inv.total_amount,
      'status', v_current
    );

    perform public.enqueue_notification(v_owner_user_id, 'EMAIL', v_type, v_payload);
    v_enqueued := v_enqueued + 1;

    perform public.enqueue_notification(v_owner_user_id, 'IN_APP', v_type, v_payload);
    v_enqueued := v_enqueued + 1;

    if v_owner_phone is not null and char_length(v_owner_phone) > 0 then
      perform public.enqueue_notification(v_owner_user_id, 'SMS', v_type, v_payload);
      v_enqueued := v_enqueued + 1;
    end if;
  end loop;

  return v_enqueued;
end;
$$;

comment on function public.send_reminder_job is
  'Enqueues rent reminders for invoices within the lead-time window (DUE/PARTIALLY_PAID) '
  'or OVERDUE, re-checking current status to skip PAID invoices and respecting '
  'reminder_frequency_days; EMAIL + IN_APP always, SMS when the owner has a phone. '
  'Requirements 11.1, 11.2, 11.4, 11.5, 11.7';
