-- Migration: initiate_payment RPC
-- Task 16.2
-- Requirements 9.1, 9.6
--
-- Validates that the Invoice belongs to the caller (owner resolved server-side from
-- auth.uid(), never client-supplied), is not already PAID, and that the requested amount
-- is between 0.01 and the current outstanding due amount; then inserts a PENDING payment
-- attempt. SECURITY DEFINER because owners have SELECT-only access to payment under RLS
-- (Task 16.11) — the ownership check here is what authorizes the insert.

create function public.initiate_payment(
  p_invoice_id uuid,
  p_gateway public.gateway_type,
  p_amount numeric,
  p_transaction_ref text default null
)
returns public.payment
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid := public.current_office_owner_id();
  v_invoice public.invoice;
  v_completed numeric(12, 2);
  v_outstanding numeric(12, 2);
  v_payment public.payment;
begin
  if v_owner is null then
    raise exception 'permission denied: only an Office_Owner may initiate a payment'
      using errcode = '42501';
  end if;

  -- Ownership enforced in the predicate: an invoice belonging to another owner is
  -- indistinguishable from a non-existent one (Requirement 4.8).
  select * into v_invoice
    from public.invoice
   where id = p_invoice_id
     and office_owner_id = v_owner;

  if not found then
    raise exception 'invoice not found' using errcode = '22023';
  end if;

  if v_invoice.status = 'PAID' then
    raise exception 'invoice is already paid' using errcode = '23505';  -- Requirement 9.6
  end if;

  select coalesce(sum(amount), 0) into v_completed
    from public.payment
   where invoice_id = p_invoice_id
     and status = 'COMPLETED';

  v_outstanding := v_invoice.total_amount - v_completed;

  if p_amount is null or p_amount < 0.01 or p_amount > v_outstanding then
    raise exception 'payment amount must be between 0.01 and the outstanding due amount (%)', v_outstanding
      using errcode = '22023';  -- Requirement 9.1
  end if;

  insert into public.payment (invoice_id, office_owner_id, gateway, transaction_ref, amount, status)
  values (p_invoice_id, v_owner, p_gateway, p_transaction_ref, p_amount, 'PENDING')
  returning * into v_payment;

  return v_payment;
end;
$$;

comment on function public.initiate_payment is
  'Validates invoice ownership (server-resolved), non-PAID status, and amount in '
  '[0.01, outstanding] before inserting a PENDING payment attempt. Requirements 9.1, 9.6';

grant execute on function public.initiate_payment(uuid, public.gateway_type, numeric, text)
  to authenticated, service_role;
