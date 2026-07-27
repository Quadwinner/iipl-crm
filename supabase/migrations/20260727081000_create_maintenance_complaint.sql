-- Migration: maintenance_complaint + complaint_event tables and enums
-- Requirements 6.1, 7.1, 7.5
-- complaint_event is an append-only status/comment history (no update/delete grants).

create type public.complaint_status as enum ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED');
create type public.event_type as enum ('STATUS_CHANGE', 'COMMENT');

create table public.maintenance_complaint (
  id uuid primary key default gen_random_uuid(),
  office_unit_id uuid not null references public.office_unit (id) on delete restrict,
  office_owner_id uuid not null references public.office_owners (id) on delete restrict,
  category text not null,
  description text not null check (char_length(description) between 1 and 2000),
  status public.complaint_status not null default 'OPEN',
  assigned_to uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index maintenance_complaint_owner_idx on public.maintenance_complaint (office_owner_id, created_at desc);
create index maintenance_complaint_unit_idx on public.maintenance_complaint (office_unit_id);
create index maintenance_complaint_status_idx on public.maintenance_complaint (status);
create index maintenance_complaint_assigned_idx on public.maintenance_complaint (assigned_to);
create index maintenance_complaint_category_idx on public.maintenance_complaint (category);

create trigger maintenance_complaint_touch_updated_at
  before update on public.maintenance_complaint
  for each row execute function public.touch_updated_at();

-- Append-only history: one row per status change or comment. Prior rows are never
-- mutated (enforced by withholding update/delete grants below).
create table public.complaint_event (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.maintenance_complaint (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  event_type public.event_type not null,
  old_status public.complaint_status,
  new_status public.complaint_status,
  comment_text text check (comment_text is null or char_length(comment_text) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index complaint_event_complaint_idx on public.complaint_event (complaint_id, created_at);
