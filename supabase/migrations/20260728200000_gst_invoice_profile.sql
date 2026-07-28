-- GST tax invoice support: company billing profile, invoice numbers, PDF storage.

insert into storage.buckets (id, name, public, file_size_limit)
values ('invoices', 'invoices', false, 52428800)
on conflict (id) do nothing;

alter table public.global_config
  add column if not exists company_legal_name text not null default 'ITOBY INFOTECH PRIVATE LIMITED',
  add column if not exists company_gstin text not null default '09AAECI3525R1Z1',
  add column if not exists company_address text not null default
    'A-64, F-25, SECTOR-63, NOIDA, Gautam Buddh Nagar, UTTAR PRADESH-201301',
  add column if not exists company_phone text not null default '+91 9142773500',
  add column if not exists company_email text not null default 'info@itobyinfotech.com',
  add column if not exists company_place_of_supply text not null default '09-UTTAR PRADESH',
  add column if not exists bank_name text not null default 'HDFC Bank',
  add column if not exists bank_account_number text not null default '50200067511455',
  add column if not exists bank_ifsc text not null default 'HDFC0004767',
  add column if not exists bank_branch text not null default 'SHAKARPUR',
  add column if not exists invoice_series_prefix text not null default 'IIPL',
  add column if not exists default_gst_rate_percent numeric(5, 2) not null default 18
    check (default_gst_rate_percent >= 0 and default_gst_rate_percent <= 100),
  add column if not exists default_hsn_sac text not null default '997212'
    check (char_length(default_hsn_sac) between 4 and 12);

alter table public.office_owners
  add column if not exists company_name varchar(150),
  add column if not exists gstin varchar(15),
  add column if not exists billing_address text;

alter table public.invoice
  add column if not exists invoice_number text unique,
  add column if not exists document_ref text;

create table if not exists public.invoice_number_counter (
  financial_year text primary key,
  last_number integer not null default 0 check (last_number >= 0)
);

create or replace function public.financial_year_label(p_date date default current_date)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when extract(month from p_date) >= 4
      then extract(year from p_date)::text || '-' || right((extract(year from p_date)::integer + 1)::text, 2)
    else (extract(year from p_date)::integer - 1)::text || '-' || right(extract(year from p_date)::text, 2)
  end;
$$;

create or replace function public.next_invoice_number(p_date date default current_date)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fy text;
  v_prefix text;
  v_next integer;
begin
  v_fy := public.financial_year_label(p_date);
  select invoice_series_prefix into v_prefix from public.global_config where id = 1;

  insert into public.invoice_number_counter as c (financial_year, last_number)
  values (v_fy, 1)
  on conflict (financial_year) do update
    set last_number = c.last_number + 1
  returning last_number into v_next;

  return v_prefix || '/' || v_fy || '/' || v_next::text;
end;
$$;

create or replace function public.assign_invoice_number(p_invoice_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.invoice;
  v_number text;
begin
  select * into v_row from public.invoice where id = p_invoice_id for update;
  if v_row.id is null then
    raise exception 'invoice not found' using errcode = '22023';
  end if;

  if v_row.invoice_number is not null then
    return v_row.invoice_number;
  end if;

  v_number := public.next_invoice_number(coalesce(v_row.due_date, current_date));

  update public.invoice
     set invoice_number = v_number
   where id = p_invoice_id
  returning invoice_number into v_number;

  return v_number;
end;
$$;

create or replace function public.invoice_set_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.invoice_number is null then
    new.invoice_number := public.next_invoice_number(coalesce(new.due_date, current_date));
  end if;
  return new;
end;
$$;

drop trigger if exists invoice_assign_number on public.invoice;
create trigger invoice_assign_number
  before insert on public.invoice
  for each row execute function public.invoice_set_number();

-- Backfill any invoices created before this migration.
do $$
declare
  v_invoice record;
begin
  for v_invoice in
    select id, due_date from public.invoice where invoice_number is null order by created_at
  loop
    update public.invoice
       set invoice_number = public.next_invoice_number(coalesce(v_invoice.due_date, current_date))
     where id = v_invoice.id;
  end loop;
end;
$$;

create or replace function public.configure_company_billing(
  p_company_legal_name text,
  p_company_gstin text,
  p_company_address text,
  p_company_phone text,
  p_company_email text,
  p_company_place_of_supply text,
  p_bank_name text,
  p_bank_account_number text,
  p_bank_ifsc text,
  p_bank_branch text,
  p_invoice_series_prefix text,
  p_default_gst_rate_percent numeric,
  p_default_hsn_sac text
)
returns public.global_config
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.global_config;
begin
  perform public.require_permission('CONFIG_MANAGE');

  if char_length(trim(p_company_legal_name)) < 1 then
    raise exception 'company legal name is required' using errcode = '22023';
  end if;

  if p_default_gst_rate_percent < 0 or p_default_gst_rate_percent > 100 then
    raise exception 'GST rate must be between 0 and 100' using errcode = '22023';
  end if;

  update public.global_config
     set company_legal_name = trim(p_company_legal_name),
         company_gstin = trim(p_company_gstin),
         company_address = trim(p_company_address),
         company_phone = trim(p_company_phone),
         company_email = trim(p_company_email),
         company_place_of_supply = trim(p_company_place_of_supply),
         bank_name = trim(p_bank_name),
         bank_account_number = trim(p_bank_account_number),
         bank_ifsc = trim(p_bank_ifsc),
         bank_branch = trim(p_bank_branch),
         invoice_series_prefix = trim(p_invoice_series_prefix),
         default_gst_rate_percent = p_default_gst_rate_percent,
         default_hsn_sac = trim(p_default_hsn_sac),
         updated_at = now()
   where id = 1
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.owner_of_invoice(p_object_key text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select office_owner_id from public.invoice where document_ref = p_object_key;
$$;

create policy invoices_admin_all on storage.objects
  for all to authenticated
  using (bucket_id = 'invoices' and public.is_administrator())
  with check (bucket_id = 'invoices' and public.is_administrator());

create policy invoices_owner_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'invoices'
    and public.owner_of_invoice(name) = public.current_office_owner_id()
  );

grant execute on function public.financial_year_label(date) to authenticated, service_role;
grant execute on function public.next_invoice_number(date) to authenticated, service_role;
grant execute on function public.assign_invoice_number(uuid) to authenticated, service_role;
grant execute on function public.configure_company_billing(
  text, text, text, text, text, text, text, text, text, text, text, numeric, text
) to authenticated, service_role;
grant execute on function public.owner_of_invoice(text) to authenticated, service_role;
