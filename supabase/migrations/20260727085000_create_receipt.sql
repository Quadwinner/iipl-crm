-- Migration: receipt table
-- Task 18.1
-- Requirements 10.1
--
-- One Receipt per completed Payment: UNIQUE(payment_id) is the mechanism behind
-- "one Receipt per completed Payment". The row is inserted inside the same
-- transaction as the completed Payment (handle_payment_callback, Task 18.2) so it is
-- available the instant the Payment commits (Requirement 10.2), independent of
-- Notification delivery.
--
-- Owner name and unit code are snapshotted at generation time so the Receipt remains
-- an accurate proof of payment even if the owner later edits their profile or the
-- unit is renamed (Requirement 10.1). document_ref is the object path of the rendered
-- PDF inside the private `receipts` bucket; it stays null until the follow-up PDF
-- render Edge Function populates it.

create table public.receipt (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null unique references public.payment (id) on delete restrict,
  office_owner_id uuid not null references public.office_owners (id) on delete restrict,
  office_owner_name text not null,
  office_unit_id uuid not null references public.office_unit (id) on delete restrict,
  office_unit_code text not null,
  invoice_period text not null check (char_length(invoice_period) between 1 and 100),
  amount_paid numeric(12, 2) not null check (amount_paid > 0),
  payment_gateway public.gateway_type not null,
  transaction_ref text,
  completed_at timestamptz not null,
  document_ref text,
  generated_at timestamptz not null default now()
);

create index receipt_office_owner_idx on public.receipt (office_owner_id);
create index receipt_payment_idx on public.receipt (payment_id);

comment on table public.receipt is
  'Proof of a completed Payment (Requirement 10.1). One row per completed Payment '
  '(unique payment_id), generated inside the payment callback transaction. document_ref '
  'is the object path of the rendered PDF in the receipts bucket, populated asynchronously.';
