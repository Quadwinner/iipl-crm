-- Migration: allotment + lease tables, allotment_status enum, billing_cycle type
-- Requirements 3.1, 3.2

create type public.allotment_status as enum ('ACTIVE', 'TERMINATED', 'EXPIRED');
create type public.billing_cycle as enum ('MONTHLY', 'QUARTERLY', 'YEARLY');

create table public.allotment (
  id uuid primary key default gen_random_uuid(),
  office_unit_id uuid not null references public.office_unit (id) on delete restrict,
  office_owner_id uuid not null references public.office_owners (id) on delete restrict,
  status public.allotment_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  terminated_at timestamptz,
  expiration_reason text
);

-- At most one ACTIVE allotment per office unit (Requirement 3.2).
create unique index allotment_one_active_per_unit
  on public.allotment (office_unit_id)
  where status = 'ACTIVE';

create index allotment_office_unit_idx on public.allotment (office_unit_id, created_at desc);
create index allotment_office_owner_idx on public.allotment (office_owner_id);
create index allotment_status_idx on public.allotment (status);

create table public.lease (
  id uuid primary key default gen_random_uuid(),
  allotment_id uuid not null unique references public.allotment (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  rent_amount numeric(12, 2) not null check (rent_amount > 0),
  billing_cycle public.billing_cycle not null,
  created_at timestamptz not null default now(),
  check (end_date > start_date)
);

create index lease_allotment_idx on public.lease (allotment_id);
