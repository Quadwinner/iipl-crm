-- Migration: wire Receipt generation into handle_payment_callback
-- Task 18.2
-- Requirements 10.1
--
-- CREATE OR REPLACE of the Task 16.6 function to insert the Receipt row in the SAME
-- transaction that records a completed Payment. The completed Payment and its Receipt
-- now commit together (Requirement 10.1) and the Receipt is available immediately for
-- download (Requirement 10.2). Owner name, unit code, and invoice period are
-- snapshotted at generation time. PDF rendering is a follow-up async step (the
-- receipt-pdf Edge Function) that populates receipt.document_ref, so a completed
-- Payment never blocks on PDF rendering.
--
-- Everything else about the function is unchanged from Task 16.6: idempotent locked
-- read on (gateway, transaction_ref), Invoice status recompute, PAYMENT_RECORD audit
-- entry, receipt Notification, and the untouched failure/cancellation branch.

create or replace function public.handle_payment_callback(
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
  v_owner_name text;
  v_unit_code text;
  v_new_total numeric(12, 2);
  v_new_status public.invoice_status;
  v_payment public.payment;
  v_receipt_id uuid;
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

    -- Receipt generation (Requirement 10.1): one Receipt per completed Payment, in this
    -- same transaction, so the completed Payment and its Receipt commit together and the
    -- Receipt is downloadable the instant the Payment commits (Requirement 10.2). Owner
    -- name, unit code, and invoice period are snapshotted here. document_ref is left null
    -- and populated later by the receipt-pdf Edge Function.
    select name into v_owner_name
      from public.office_owners
     where id = v_invoice.office_owner_id;

    select unit_code into v_unit_code
      from public.office_unit
     where id = v_invoice.office_unit_id;

    insert into public.receipt (
      payment_id, office_owner_id, office_owner_name, office_unit_id, office_unit_code,
      invoice_period, amount_paid, payment_gateway, transaction_ref, completed_at
    )
    values (
      v_payment.id, v_invoice.office_owner_id, v_owner_name, v_invoice.office_unit_id,
      v_unit_code, v_invoice.billing_cycle_key, v_payment.amount, p_gateway,
      p_transaction_ref, v_payment.completed_at
    )
    returning id into v_receipt_id;

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
        'receipt_id', v_receipt_id,
        'invoice_id', p_invoice_id,
        'amount', p_amount,
        'gateway', p_gateway
      )
    );

    return jsonb_build_object(
      'result', 'completed',
      'payment_id', v_payment.id,
      'receipt_id', v_receipt_id,
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
  'upserts the Payment, recomputes Invoice status (PAID/PARTIALLY_PAID), generates the '
  'Receipt (Task 18.2), writes the PAYMENT_RECORD audit entry, and enqueues the receipt '
  'Notification; on failure/cancellation records the failed attempt without touching the '
  'Invoice. Requirements 9.2, 9.4, 9.7, 9.8, 10.1, 14.1';
