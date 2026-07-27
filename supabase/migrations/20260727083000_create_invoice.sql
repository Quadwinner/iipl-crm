-- Migration: invoice_status enum + invoice table
-- Requirements 8.1, 8.6
-- UNIQUE(lease_id, billing_cycle_key) is the dedup guard: at most one invoice per
-- lease per billing cycle (Requirement 8.6).

create type public.invoice_status as enum ('DUE', 'PARTIALLY_PAID', 'PAID', 'OVERDUE');

create table public.invoice (
  id uuid primary key default gen_random_uuid(),
  lease_id uuid not null references public.lease (id) on delete restrict,
  office_owner_id uuid not null references public.office_owners (id) on delete restrict,
  office_unit_id uuid not null references public.office_unit (id) on delete restrict,
  billing_cycle_key text not null check (char_length(billing_cycle_key) between 1 and 50),
  billing_period_start date not null,
  billing_period_end date not null,
  rent_amount numeric(12, 2) not null check (rent_amount >= 0),
  additional_charges numeric(12, 2) not null default 0 check (additional_charges >= 0),
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  due_date date not null,
  status public.invoice_status not null default 'DUE',
  created_at timestamptz not null default now(),
  unique (lease_id, billing_cycle_key),
  check (billing_period_end >= billing_period_start)
);

create index invoice_office_owner_idx on public.invoice (office_owner_id);
create index invoice_office_unit_idx on public.invoice (office_unit_id);
create index invoice_lease_idx on public.invoice (lease_id);
create index invoice_status_idx on public.invoice (status);
create index invoice_due_date_idx on public.invoice (due_date) where status in ('DUE', 'PARTIALLY_PAID');
