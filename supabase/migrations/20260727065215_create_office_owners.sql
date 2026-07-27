-- Migration: office_owners table and owner_status enum
-- Requirement 4: Office Owner Account Management

create type public.owner_status as enum ('ACTIVE', 'DEACTIVATED');

create table public.office_owners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (user_id) on delete cascade,
  name varchar(100) not null check (char_length(name) between 1 and 100),
  contact_email varchar(255) not null unique,
  phone varchar(15) not null check (char_length(phone) between 10 and 15),
  status public.owner_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index office_owners_user_id_idx on public.office_owners (user_id);
create index office_owners_status_idx on public.office_owners (status);
create index office_owners_contact_email_idx on public.office_owners (contact_email);

alter table public.office_owners enable row level security;

-- Office owners can view and update their own record
create policy office_owners_select_self on public.office_owners
  for select to authenticated
  using (user_id = auth.uid());

create policy office_owners_update_self on public.office_owners
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Administrators can view all office owners
create policy office_owners_select_admin on public.office_owners
  for select to authenticated
  using (public.is_administrator());

-- Administrators can insert and update office owners
create policy office_owners_insert_admin on public.office_owners
  for insert to authenticated
  with check (public.is_administrator());

create policy office_owners_update_admin on public.office_owners
  for update to authenticated
  using (public.is_administrator())
  with check (public.is_administrator());

-- Trigger to update updated_at timestamp
create function public.update_office_owners_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger office_owners_updated_at
  before update on public.office_owners
  for each row execute function public.update_office_owners_updated_at();

-- Grant appropriate permissions
revoke all on public.office_owners from anon;
grant select, update on public.office_owners to authenticated;
grant all on public.office_owners to service_role;
