-- Migration: leads capture
-- The public form can reach this table ONLY through submit_lead(). There is no
-- INSERT policy on purpose: anon holds no insert grant and no policy, so the
-- security definer function is the single, rate-limited write path.
-- Status changes go through update_lead_status(), which pairs the permission
-- check with the audit row in one transaction (Requirement 14.1/14.4 pattern).

create type public.lead_source as enum (
  'CONTACT_FORM', 'QUOTE_REQUEST', 'PRODUCT_INQUIRY', 'SERVICE_INQUIRY', 'OTHER'
);

create type public.lead_status as enum (
  'NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'CLOSED'
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null default '',
  company text not null default '',
  service_interest text not null default '',
  module_key text references public.app_modules (key) on delete set null,
  budget_range text not null default '',
  message text not null default '',
  source public.lead_source not null default 'CONTACT_FORM',
  status public.lead_status not null default 'NEW',
  assigned_to uuid references public.profiles (user_id) on delete set null,
  staff_notes text not null default '',
  page_path text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_status_idx on public.leads (status, created_at desc);
create index leads_email_created_idx on public.leads (lower(email), created_at desc);

create trigger leads_touch_updated_at
  before update on public.leads
  for each row execute function public.touch_updated_at();

alter table public.leads enable row level security;

-- Read and update require the staff permissions; there is NO insert policy.
create policy leads_select_staff on public.leads
  for select to authenticated
  using (public.authorize('LEAD_READ'));

create policy leads_update_staff on public.leads
  for update to authenticated
  using (public.authorize('LEAD_MANAGE'))
  with check (public.authorize('LEAD_MANAGE'));

/**
 * The only way a visitor's enquiry reaches the database.
 *
 * Rate limited to 5 submissions per email address per rolling hour; the 6th
 * raises SQLSTATE 53400 (configuration_limit_exceeded) with a message written
 * for the visitor, so the form can surface it verbatim.
 */
create function public.submit_lead(
  p_full_name text,
  p_email text,
  p_phone text default '',
  p_company text default '',
  p_service_interest text default '',
  p_module_key text default null,
  p_budget_range text default '',
  p_message text default '',
  p_source public.lead_source default 'CONTACT_FORM',
  p_page_path text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recent integer;
  v_email text := lower(trim(p_email));
  v_name text := trim(p_full_name);
  v_id uuid;
begin
  if v_name = '' then
    raise exception 'Please enter your name.' using errcode = '22023';
  end if;

  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Please enter a valid email address.' using errcode = '22023';
  end if;

  select count(*) into v_recent
    from public.leads
   where lower(email) = v_email
     and created_at > now() - interval '1 hour';

  if v_recent >= 5 then
    raise exception
      'You have sent several enquiries in the last hour. Please email info@itobyinfotech.com or call +91 91427 73500 and we will pick it up right away.'
      using errcode = '53400';
  end if;

  insert into public.leads (
    full_name, email, phone, company, service_interest, module_key,
    budget_range, message, source, page_path
  )
  values (
    v_name, v_email, trim(p_phone), trim(p_company), trim(p_service_interest),
    p_module_key, trim(p_budget_range), trim(p_message), p_source, trim(p_page_path)
  )
  returning id into v_id;

  return v_id;
end;
$$;

comment on function public.submit_lead is
  'Public lead intake. The leads table has no INSERT policy; this security definer '
  'function is the only write path, rate limited to 5 per email per hour (53400).';

/**
 * Staff status transition. Permission check and audit row share one transaction,
 * so a failed audit write rolls the status change back.
 */
create function public.update_lead_status(
  p_lead_id uuid,
  p_status public.lead_status,
  p_staff_notes text default null,
  p_assigned_to uuid default null
)
returns public.leads
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old public.leads;
  v_new public.leads;
begin
  perform public.require_permission('LEAD_MANAGE');

  select * into v_old from public.leads where id = p_lead_id for update;
  if v_old.id is null then
    raise exception 'lead % not found', p_lead_id using errcode = 'P0002';
  end if;

  update public.leads
     set status      = p_status,
         staff_notes = coalesce(p_staff_notes, staff_notes),
         assigned_to = coalesce(p_assigned_to, assigned_to)
   where id = p_lead_id
  returning * into v_new;

  perform public.record_audit(
    'LEAD_STATUS_UPDATE', 'lead', p_lead_id,
    'status', v_old.status::text, v_new.status::text
  );

  return v_new;
end;
$$;

comment on function public.update_lead_status is
  'Transitions a lead. require_permission(LEAD_MANAGE) plus record_audit in one '
  'transaction — never update leads.status directly from the client.';

revoke all on public.leads from anon;
grant select, update on public.leads to authenticated;
grant all on public.leads to service_role;

-- anon may call the intake function but holds no table privilege of any kind.
grant execute on function public.submit_lead(
  text, text, text, text, text, text, text, text, public.lead_source, text
) to anon, authenticated, service_role;

grant execute on function public.update_lead_status(uuid, public.lead_status, text, uuid)
  to authenticated, service_role;
