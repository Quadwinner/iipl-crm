-- Migration: file storage tables — file_storage_config, file_attachment, document
-- Task 12.1
-- Requirements 13.4 (configurable per-type accepted flag + max file size), plus the
-- link tables backing Maintenance_Complaint attachments (6.1, 6.5) and Lease/
-- Office_Owner documents (13.1). Storage object keys are opaque (UUID-based) and
-- never derived from user-supplied file names.

-- Per-extension upload configuration. file_type_accepted gates the type; each row
-- carries its own max_file_size_mb ceiling (Requirement 13.4).
create table public.file_storage_config (
  id uuid primary key default gen_random_uuid(),
  file_extension text not null unique check (char_length(file_extension) between 1 and 20),
  mime_type text not null check (char_length(mime_type) between 1 and 255),
  file_type_accepted boolean not null default true,
  max_file_size_mb integer not null check (max_file_size_mb > 0),
  updated_at timestamptz not null default now()
);

insert into public.file_storage_config (file_extension, mime_type, file_type_accepted, max_file_size_mb) values
  ('pdf', 'application/pdf', true, 25),
  ('jpg', 'image/jpeg', true, 10),
  ('jpeg', 'image/jpeg', true, 10),
  ('png', 'image/png', true, 10),
  ('webp', 'image/webp', true, 10),
  ('doc', 'application/msword', true, 25),
  ('docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', true, 25),
  ('xls', 'application/vnd.ms-excel', true, 25),
  ('xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', true, 25);

-- Maintenance_Complaint attachments. Linked to the complaint; the owning
-- Office_Owner is resolved through maintenance_complaint (see owner_of_attachment).
create table public.file_attachment (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.maintenance_complaint (id) on delete cascade,
  bucket_id text not null default 'complaint-attachments',
  object_key text not null unique,
  file_name text not null check (char_length(file_name) between 1 and 255),
  file_extension text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index file_attachment_complaint_idx on public.file_attachment (complaint_id, created_at);
create index file_attachment_object_key_idx on public.file_attachment (object_key);

-- Lease / Office_Owner documents. office_owner_id is always populated (resolved from
-- the lease's allotment when the document is lease-linked) so owner scoping is a
-- single-column predicate. At least one of lease_id / office_owner_id is required.
create table public.document (
  id uuid primary key default gen_random_uuid(),
  lease_id uuid references public.lease (id) on delete cascade,
  office_owner_id uuid references public.office_owners (id) on delete cascade,
  bucket_id text not null default 'owner-documents',
  object_key text not null unique,
  file_name text not null check (char_length(file_name) between 1 and 255),
  file_extension text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check (lease_id is not null or office_owner_id is not null)
);

create index document_lease_idx on public.document (lease_id);
create index document_owner_idx on public.document (office_owner_id);
create index document_object_key_idx on public.document (object_key);

-- RLS ------------------------------------------------------------------------

alter table public.file_storage_config enable row level security;
alter table public.file_attachment enable row level security;
alter table public.document enable row level security;

-- file_storage_config: readable by all authenticated (portal pre-check + Edge
-- Function validation), writable only by Administrator (via configure_file_types).
create policy file_storage_config_select on public.file_storage_config
  for select to authenticated
  using (true);

create policy file_storage_config_write_admin on public.file_storage_config
  for all to authenticated
  using (public.is_administrator())
  with check (public.is_administrator());

-- file_attachment: Administrator full access; Maintenance_Staff read all (they
-- work complaints); Office_Owner reads only attachments on their own complaints.
create policy file_attachment_all_admin on public.file_attachment
  for all to authenticated
  using (public.is_administrator())
  with check (public.is_administrator());

create policy file_attachment_select_staff on public.file_attachment
  for select to authenticated
  using (public.current_role() = 'MAINTENANCE_STAFF');

create policy file_attachment_select_owner on public.file_attachment
  for select to authenticated
  using (
    complaint_id in (
      select id from public.maintenance_complaint
      where office_owner_id = public.current_office_owner_id()
    )
  );

-- document: Administrator full access; Office_Owner reads only their own documents.
create policy document_all_admin on public.document
  for all to authenticated
  using (public.is_administrator())
  with check (public.is_administrator());

create policy document_select_owner on public.document
  for select to authenticated
  using (office_owner_id = public.current_office_owner_id());

-- Grants ----------------------------------------------------------------------

revoke all on public.file_storage_config, public.file_attachment, public.document from anon;

grant select on public.file_storage_config to authenticated;
grant insert, update, delete on public.file_storage_config to authenticated;
grant all on public.file_storage_config to service_role;

grant select on public.file_attachment to authenticated;
grant all on public.file_attachment to service_role;

grant select on public.document to authenticated;
grant all on public.document to service_role;
