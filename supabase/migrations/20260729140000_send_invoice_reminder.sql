-- Admin can manually share a bill reminder for one unpaid invoice (email, SMS, in-app).

insert into public.role_permissions (permission_key, role)
values ('BILLING_SEND_REMINDER', 'ADMINISTRATOR')
on conflict do nothing;

create or replace function public.send_invoice_reminder(p_invoice_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv public.invoice;
  v_owner_user_id uuid;
  v_owner_phone text;
  v_type text;
  v_payload jsonb;
  v_enqueued integer := 0;
begin
  perform public.require_permission('BILLING_SEND_REMINDER');

  select * into v_inv
    from public.invoice
   where id = p_invoice_id
     for update;

  if not found then
    raise exception 'invoice not found: %', p_invoice_id
      using errcode = 'P0002';
  end if;

  if v_inv.status = 'PAID' then
    raise exception 'cannot send a reminder for a paid invoice'
      using errcode = '22023';
  end if;

  if v_inv.status = 'OVERDUE' then
    v_type := 'REMINDER_OVERDUE';
  elsif v_inv.status in ('DUE', 'PARTIALLY_PAID') then
    v_type := 'REMINDER_UPCOMING';
  else
    raise exception 'invoice status % is not eligible for a reminder', v_inv.status
      using errcode = '22023';
  end if;

  select user_id, phone into v_owner_user_id, v_owner_phone
    from public.office_owners
   where id = v_inv.office_owner_id;

  if v_owner_user_id is null then
    raise exception 'office owner not found for invoice %', p_invoice_id
      using errcode = 'P0002';
  end if;

  v_payload := jsonb_build_object(
    'invoice_id', v_inv.id,
    'due_date', v_inv.due_date,
    'amount', v_inv.total_amount,
    'amount_due', v_inv.total_amount,
    'status', v_inv.status,
    'manual', true
  );

  perform public.enqueue_notification(v_owner_user_id, 'EMAIL', v_type, v_payload);
  v_enqueued := v_enqueued + 1;

  perform public.enqueue_notification(v_owner_user_id, 'IN_APP', v_type, v_payload);
  v_enqueued := v_enqueued + 1;

  if v_owner_phone is not null and char_length(v_owner_phone) > 0 then
    perform public.enqueue_notification(v_owner_user_id, 'SMS', v_type, v_payload);
    v_enqueued := v_enqueued + 1;
  end if;

  perform public.record_audit(
    'INVOICE_REMINDER_SEND',
    'invoice',
    p_invoice_id,
    'reminder',
    null,
    v_type
  );

  return jsonb_build_object(
    'success', true,
    'invoice_id', p_invoice_id,
    'notification_type', v_type,
    'enqueued', v_enqueued
  );
end;
$$;

revoke all on function public.send_invoice_reminder(uuid) from public;
grant execute on function public.send_invoice_reminder(uuid) to authenticated;

comment on function public.send_invoice_reminder(uuid) is
  'Administrator-only: enqueue email, in-app, and SMS (when phone exists) bill reminders for one unpaid invoice.';
