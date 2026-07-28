-- Building operational expenses (cleaning, guard salary, diesel, etc.)
-- Administrator-only via EXPENSE_MANAGE permission and RPCs.

create type public.expense_category as enum (
  'CLEANING',
  'GUARD_SALARY',
  'DIESEL',
  'ELECTRICITY',
  'WATER',
  'REPAIRS',
  'MAINTENANCE',
  'SUPPLIES',
  'OTHER'
);

create table public.building_expense (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.building (id) on delete restrict,
  category public.expense_category not null,
  title text not null check (char_length(title) between 1 and 200),
  description text check (description is null or char_length(description) <= 2000),
  amount numeric(12, 2) not null
    check (amount >= 0.01 and amount <= 9999999.99),
  expense_date date not null,
  vendor_name text check (vendor_name is null or char_length(vendor_name) <= 150),
  reference_note text check (reference_note is null or char_length(reference_note) <= 200),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index building_expense_building_idx on public.building_expense (building_id);
create index building_expense_date_idx on public.building_expense (expense_date desc);
create index building_expense_category_idx on public.building_expense (category);

create trigger building_expense_touch_updated_at
  before update on public.building_expense
  for each row execute function public.touch_updated_at();

insert into public.role_permissions (permission_key, role) values
  ('EXPENSE_MANAGE', 'ADMINISTRATOR');

create function public.list_building_expenses(
  p_building_id uuid default null,
  p_category public.expense_category default null,
  p_start_date date default null,
  p_end_date date default null
)
returns table (
  id uuid,
  building_id uuid,
  building_name text,
  category public.expense_category,
  title text,
  description text,
  amount numeric,
  expense_date date,
  vendor_name text,
  reference_note text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_permission('EXPENSE_MANAGE');

  if p_start_date is not null and p_end_date is not null then
    perform public.assert_valid_date_range(p_start_date, p_end_date);
  end if;

  return query
    select
      e.id,
      e.building_id,
      b.name::text,
      e.category,
      e.title,
      e.description,
      e.amount,
      e.expense_date,
      e.vendor_name,
      e.reference_note,
      e.created_at,
      e.updated_at
    from public.building_expense e
    join public.building b on b.id = e.building_id
    where (p_building_id is null or e.building_id = p_building_id)
      and (p_category is null or e.category = p_category)
      and (p_start_date is null or e.expense_date >= p_start_date)
      and (p_end_date is null or e.expense_date <= p_end_date)
    order by e.expense_date desc, e.created_at desc;
end;
$$;

create function public.create_building_expense(
  p_building_id uuid,
  p_category public.expense_category,
  p_title text,
  p_amount numeric,
  p_expense_date date,
  p_description text default null,
  p_vendor_name text default null,
  p_reference_note text default null
)
returns public.building_expense
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.building_expense;
begin
  perform public.require_permission('EXPENSE_MANAGE');

  if not exists (select 1 from public.building where id = p_building_id) then
    raise exception 'building not found' using errcode = '22023';
  end if;

  if char_length(trim(p_title)) < 1 or char_length(p_title) > 200 then
    raise exception 'title must be between 1 and 200 characters' using errcode = '22023';
  end if;

  if p_amount is null or p_amount < 0.01 or p_amount > 9999999.99 then
    raise exception 'amount must be between 0.01 and 9999999.99' using errcode = '22023';
  end if;

  if p_expense_date is null then
    raise exception 'expense date is required' using errcode = '22023';
  end if;

  insert into public.building_expense (
    building_id,
    category,
    title,
    description,
    amount,
    expense_date,
    vendor_name,
    reference_note,
    created_by
  )
  values (
    p_building_id,
    p_category,
    trim(p_title),
    nullif(trim(p_description), ''),
    p_amount,
    p_expense_date,
    nullif(trim(p_vendor_name), ''),
    nullif(trim(p_reference_note), ''),
    auth.uid()
  )
  returning * into v_row;

  perform public.record_audit('EXPENSE_CREATE', 'building_expense', v_row.id);

  return v_row;
end;
$$;

create function public.update_building_expense(
  p_expense_id uuid,
  p_building_id uuid default null,
  p_category public.expense_category default null,
  p_title text default null,
  p_amount numeric default null,
  p_expense_date date default null,
  p_description text default null,
  p_vendor_name text default null,
  p_reference_note text default null
)
returns public.building_expense
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old public.building_expense;
  v_row public.building_expense;
begin
  perform public.require_permission('EXPENSE_MANAGE');

  select * into v_old from public.building_expense where id = p_expense_id for update;
  if v_old.id is null then
    raise exception 'expense not found' using errcode = '22023';
  end if;

  if p_building_id is not null and not exists (select 1 from public.building where id = p_building_id) then
    raise exception 'building not found' using errcode = '22023';
  end if;

  if p_title is not null and (char_length(trim(p_title)) < 1 or char_length(p_title) > 200) then
    raise exception 'title must be between 1 and 200 characters' using errcode = '22023';
  end if;

  if p_amount is not null and (p_amount < 0.01 or p_amount > 9999999.99) then
    raise exception 'amount must be between 0.01 and 9999999.99' using errcode = '22023';
  end if;

  update public.building_expense
     set building_id = coalesce(p_building_id, building_id),
         category = coalesce(p_category, category),
         title = coalesce(trim(p_title), title),
         description = case
           when p_description is null then description
           else nullif(trim(p_description), '')
         end,
         amount = coalesce(p_amount, amount),
         expense_date = coalesce(p_expense_date, expense_date),
         vendor_name = case
           when p_vendor_name is null then vendor_name
           else nullif(trim(p_vendor_name), '')
         end,
         reference_note = case
           when p_reference_note is null then reference_note
           else nullif(trim(p_reference_note), '')
         end
   where id = p_expense_id
  returning * into v_row;

  if p_amount is not null and p_amount is distinct from v_old.amount then
    perform public.record_audit(
      'EXPENSE_MODIFY', 'building_expense', v_row.id, 'amount', v_old.amount::text, v_row.amount::text
    );
  end if;

  if p_category is not null and p_category is distinct from v_old.category then
    perform public.record_audit(
      'EXPENSE_MODIFY', 'building_expense', v_row.id, 'category', v_old.category::text, v_row.category::text
    );
  end if;

  if p_title is not null and trim(p_title) is distinct from v_old.title then
    perform public.record_audit(
      'EXPENSE_MODIFY', 'building_expense', v_row.id, 'title', v_old.title, v_row.title
    );
  end if;

  return v_row;
end;
$$;

create function public.delete_building_expense(p_expense_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old public.building_expense;
begin
  perform public.require_permission('EXPENSE_MANAGE');

  select * into v_old from public.building_expense where id = p_expense_id for update;
  if v_old.id is null then
    raise exception 'expense not found' using errcode = '22023';
  end if;

  perform public.record_audit('EXPENSE_DELETE', 'building_expense', v_old.id);

  delete from public.building_expense where id = p_expense_id;
end;
$$;

alter table public.building_expense enable row level security;

create policy building_expense_select_admin on public.building_expense
  for select to authenticated
  using (public.authorize('EXPENSE_MANAGE'));

revoke all on public.building_expense from anon;
grant select on public.building_expense to authenticated;
grant all on public.building_expense to service_role;

grant execute on function public.list_building_expenses(uuid, public.expense_category, date, date)
  to authenticated, service_role;
grant execute on function public.create_building_expense(
  uuid, public.expense_category, text, numeric, date, text, text, text
) to authenticated, service_role;
grant execute on function public.update_building_expense(
  uuid, uuid, public.expense_category, text, numeric, date, text, text, text
) to authenticated, service_role;
grant execute on function public.delete_building_expense(uuid)
  to authenticated, service_role;
