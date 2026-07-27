-- Migration: gateway_type + payment_status enums, payment table, payment_verification_failures
-- Task 16.1
-- Requirements 9.4, 9.7, 9.8
--
-- Idempotency guard (Requirement 9.8): a partial unique index on (gateway, transaction_ref)
-- restricted to COMPLETED rows means at most one completed Payment can exist per gateway
-- reference, while PENDING/FAILED/CANCELLED attempts may repeat that reference freely. The
-- locked read in handle_payment_callback plus this constraint serialize concurrent
-- duplicate callbacks so only the first records a completed Payment.
--
-- payment_verification_failures (Requirement 9.7) records callbacks whose signature could
-- not be verified. It is written by the webhook Edge Functions before any state change and
-- stores only a hash of the raw body, never the raw payload or any secret.

create type public.gateway_type as enum ('UPI', 'RAZORPAY');
create type public.payment_status as enum ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

create table public.payment (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoice (id) on delete restrict,
  office_owner_id uuid not null references public.office_owners (id) on delete restrict,
  gateway public.gateway_type not null,
  transaction_ref text check (transaction_ref is null or char_length(transaction_ref) between 1 and 255),
  amount numeric(12, 2) not null check (amount > 0),
  status public.payment_status not null default 'PENDING',
  failure_reason text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Requirement 9.8: at most one COMPLETED payment per (gateway, transaction_ref).
create unique index payment_completed_txn_ref_uniq
  on public.payment (gateway, transaction_ref)
  where status = 'COMPLETED';

create index payment_invoice_idx on public.payment (invoice_id);
create index payment_office_owner_idx on public.payment (office_owner_id);
-- Backs the locked lookup in handle_payment_callback.
create index payment_gateway_ref_idx on public.payment (gateway, transaction_ref);

create table public.payment_verification_failures (
  id uuid primary key default gen_random_uuid(),
  gateway public.gateway_type not null,
  raw_body_hash text not null,
  reason text,
  created_at timestamptz not null default now()
);

create index payment_verification_failures_gateway_idx
  on public.payment_verification_failures (gateway, created_at desc);
