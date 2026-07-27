-- Migration: handle_payment_callback RPC
-- Task 16.6
-- Requirements 9.2, 9.4, 9.7, 9.8, 14.1
--
-- The state-changing half of a verified gateway callback. The webhook Edge Function
-- verifies the signature over the raw body (Requirement 9.5/9.7) BEFORE calling this
-- function with the service-role key, so everything here runs as one atomic transaction:
-- Payment upsert, Invoice status recompute, PAYMENT_RECORD audit entry, and the receipt
-- Notification either all commit or all roll back.
--
-- Idempotency (Requirement 9.8): a locked read on (gateway, transaction_ref) is taken
-- first. If a COMPLETED payment already exists the callback is discarded with no change.
-- The partial unique index on COMPLETED rows backstops this under concurrency.
--
-- On failure/cancellation (Requirement 9.3) the failed attempt is recorded and the
-- Invoice status is left untouched.
--
-- SECURITY DEFINER: invoked only by the webhook Edge Function (service role), unreachable
-- from the public API surface.

create function public.handle_payment_callback(
  p_gateway public.gateway_type,
  p_transaction_ref text,
  p_invoice_id uuid,
  p_amount numeric,
  p_outcome text,
  p_gateway_timestamp timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing public.payment;
  v_pending_id uuid;
  v_invoice public.invoice;
  v_owner_user_id uuid;
  v_new_total numeric(12, 2);
  v_new_status public.invoice_status;
  v_payment public.payment;
begin
  if p_transaction_ref is null or char_length(p_transaction_ref) = 0 then
    raise exception 'transaction reference is required' using errcode = '22023';
  end if;

  -- Locked read across all attempts for this reference. Concurrent duplicate deliveries
  -- serialize here, so the second observes the first's COMPLETED row (Requirement 9.8).
  select * into v_existing
    from public.payment
   where gateway = p_gateway
     and transaction_ref = p_transaction_ref
     and status = 'COMPLETED'
   for update;

  if found then
    return jsonb_build_object('result', 'duplicate', 'payment_id', v_existing.id);
  end if;

  if p_outcome = 'SUCCESS' then
    select * into v_invoice
      from public.invoice
     where id = p_invoice_id
     for update;

    if not found then
      raise exception 'invoice not found for callback' using errcode = '22023';
    end if;

    -- Reuse the PENDING attempt for this reference if one exists (created by
    -- initiate_payment); otherwise record a fresh completed Payment.
    select id into v_pending_id
      from public.payment
     where gateway = p_gateway
       and transaction_ref = p_transaction_ref
       and status = 'PENDING'
     order by created_at
     limit 1
     for update;

    if v_pending_id is not null then
      update public.payment
         set status = 'COMPLETED',
             amount = p_amount,
             completed_at = p_gateway_timestamp,
             failure_reason = null
       where id = v_pending_id
      returning * into v_payment;
    else
      insert into public.payment (
        invoice_id, office_owner_id, gateway, transaction_ref, amount, status, completed_at
      )
      values (
        p_invoice_id, v_invoice.office_owner_id, p_gateway, p_transaction_ref,
        p_amount, 'COMPLETED', p_gateway_timestamp
      )
      returning * into v_payment;
    end if;

    -- Recompute Invoice status from the total received (Requirement 9.2).
    select coalesce(sum(amount), 0) into v_new_total
      from public.payment
     where invoice_id = p_invoice_id
       and status = 'COMPLETED';

    if v_new_total >= v_invoice.total_amount then
      v_new_status := 'PAID';
    else
      v_new_status := 'PARTIALLY_PAID';
    end if;

    update public.invoice set status = v_new_status where id = p_invoice_id;

    -- Receipt generation runs inside this same transaction and is wired in by Task 18.2
    -- once the receipt table exists (Requirement 10.1). It belongs here, between the
    -- Invoice update and the audit entry, so a completed Payment and its Receipt commit
    -- together.

    -- Audit entry in the same transaction: a failed audit write rolls the whole
    -- callback back (Requirement 14.1/14.4).
    perform public.record_audit('PAYMENT_RECORD', 'payment', v_payment.id);

    -- Notify the owner of the receipt. Notification delivery itself runs in a separate
    -- Edge Function invocation, so a delivery failure never fails this transaction.
    select user_id into v_owner_user_id
      from public.office_owners
     where id = v_invoice.office_owner_id;

    perform public.enqueue_notification(
      v_owner_user_id,
      'EMAIL',
      'RECEIPT',
      jsonb_build_object(
        'payment_id', v_payment.id,
        'invoice_id', p_invoice_id,
        'amount', p_amount,
        'gateway', p_gateway
      )
    );

    return jsonb_build_object(
      'result', 'completed',
      'payment_id', v_payment.id,
      'invoice_status', v_new_status
    );
  else
    -- Failure / cancellation: record the failed attempt, leave the Invoice untouched
    -- (Requirement 9.3).
    select * into v_invoice from public.invoice where id = p_invoice_id;
    if not found then
      raise exception 'invoice not found for callback' using errcode = '22023';
    end if;

    insert into public.payment (
      invoice_id, office_owner_id, gateway, transaction_ref, amount, status, failure_reason
    )
    values (
      p_invoice_id, v_invoice.office_owner_id, p_gateway, p_transaction_ref,
      p_amount,
      case when p_outcome = 'CANCELLED' then 'CANCELLED'::public.payment_status
           else 'FAILED'::public.payment_status end,
      p_outcome
    )
    returning * into v_payment;

    select user_id into v_owner_user_id
      from public.office_owners
     where id = v_invoice.office_owner_id;

    perform public.enqueue_notification(
      v_owner_user_id,
      'EMAIL',
      'PAYMENT_FAILURE',
      jsonb_build_object(
        'payment_id', v_payment.id,
        'invoice_id', p_invoice_id,
        'gateway', p_gateway,
        'outcome', p_outcome
      )
    );

    return jsonb_build_object('result', 'failure_recorded', 'payment_id', v_payment.id);
  end if;
end;
$$;

comment on function public.handle_payment_callback is
  'Atomically records a verified gateway callback: idempotent on (gateway, transaction_ref), '
  'upserts the Payment, recomputes Invoice status (PAID/PARTIALLY_PAID), writes the '
  'PAYMENT_RECORD audit entry, and enqueues the receipt Notification; on failure/cancellation '
  'records the failed attempt without touching the Invoice. Receipt generation is wired into '
  'this same transaction by Task 18.2. Requirements 9.2, 9.4, 9.7, 9.8, 14.1';

grant execute on function public.handle_payment_callback(
  public.gateway_type, text, uuid, numeric, text, timestamptz
) to service_role;
