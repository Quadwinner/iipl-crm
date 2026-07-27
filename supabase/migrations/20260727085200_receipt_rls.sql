-- Migration: RLS policies for receipt table and receipts storage bucket
-- Task 18.5
-- Requirements 4.4, 4.8
--
-- Administrator: full access. Office_Owner: read-only access to their own Receipts,
-- on both the receipt table and the backing objects in the private `receipts` bucket.
-- The owner receipt-bucket policy was deferred from Task 12.7 to here because the
-- receipt table (which maps an object path back to its owner) did not exist yet.
-- Receipts are written only by the SECURITY DEFINER handle_payment_callback function,
-- so authenticated users get SELECT only on the table.

alter table public.receipt enable row level security;

create policy receipt_all_admin on public.receipt
  for all to authenticated
  using (public.is_administrator())
  with check (public.is_administrator());

create policy receipt_select_owner on public.receipt
  for select to authenticated
  using (
    office_owner_id = (select id from public.office_owners where user_id = auth.uid())
  );

revoke all on public.receipt from anon;
grant select on public.receipt to authenticated;
grant all on public.receipt to service_role;

-- Resolves a receipts object key (receipt.document_ref) to the owning office_owner.id,
-- mirroring owner_of_attachment / owner_of_document from Task 12.7.
create function public.owner_of_receipt(p_object_key text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select office_owner_id from public.receipt where document_ref = p_object_key;
$$;

grant execute on function public.owner_of_receipt(text) to authenticated, service_role;

-- Office_Owner read access to their own receipt PDFs (Administrator access was added
-- in Task 12.7). Downloads are served as short-lived signed URLs minted only after
-- this policy allows the read.
create policy receipts_owner_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'receipts'
    and public.owner_of_receipt(name) = public.current_office_owner_id()
  );
