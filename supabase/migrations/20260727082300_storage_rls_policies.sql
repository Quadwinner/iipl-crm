-- Migration: Storage RLS policies for attachments and documents
-- Task 12.7
-- Requirements 13.2, 13.3, 13.6
-- Resolver functions map a Storage object key back to the owning office_owner, then
-- storage.objects policies grant Administrator full access and limit each
-- Office_Owner to objects linked to their own complaints / documents. Downloads are
-- served as short-lived signed URLs, minted only after these policies allow the read.

-- Resolves a complaint-attachments object key to the owning office_owner.id.
create function public.owner_of_attachment(p_object_key text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select mc.office_owner_id
  from public.file_attachment fa
  join public.maintenance_complaint mc on mc.id = fa.complaint_id
  where fa.object_key = p_object_key;
$$;

-- Resolves an owner-documents object key to the owning office_owner.id.
create function public.owner_of_document(p_object_key text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select office_owner_id from public.document where object_key = p_object_key;
$$;

grant execute on function public.owner_of_attachment(text) to authenticated, service_role;
grant execute on function public.owner_of_document(text) to authenticated, service_role;

-- complaint-attachments -------------------------------------------------------

create policy attachment_admin_all on storage.objects
  for all to authenticated
  using (bucket_id = 'complaint-attachments' and public.is_administrator())
  with check (bucket_id = 'complaint-attachments' and public.is_administrator());

create policy attachment_staff_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'complaint-attachments'
    and public.current_role() = 'MAINTENANCE_STAFF'
  );

create policy attachment_owner_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'complaint-attachments'
    and public.owner_of_attachment(name) = public.current_office_owner_id()
  );

-- owner-documents -------------------------------------------------------------

create policy document_admin_all on storage.objects
  for all to authenticated
  using (bucket_id = 'owner-documents' and public.is_administrator())
  with check (bucket_id = 'owner-documents' and public.is_administrator());

create policy document_owner_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'owner-documents'
    and public.owner_of_document(name) = public.current_office_owner_id()
  );

-- receipts --------------------------------------------------------------------
-- Administrator access now; Office_Owner receipt access is added with the receipt
-- table in Task 18.5 (the receipt table does not exist yet).

create policy receipts_admin_all on storage.objects
  for all to authenticated
  using (bucket_id = 'receipts' and public.is_administrator())
  with check (bucket_id = 'receipts' and public.is_administrator());
