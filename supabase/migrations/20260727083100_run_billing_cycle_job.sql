-- Migration: run_billing_cycle_job function
-- Requirements 8.1, 8.2, 8.6, 8.7, 14.1
-- Generates one Invoice per active lease whose billing cycle date has been reached,
-- deduplicated per (lease_id, billing_cycle_key). Each lease is processed in its own
-- subtransaction (BEGIN ... EXCEPTION ... END) so one lease's failure never aborts the
-- whole run. The INVOICE_GENERATE audit entry is written in the same subtransaction as
-- the insert, so an audit-write failure rolls that lease's invoice back (Requirement 14.4).

create function public.run_billing_cycle_job(p_as_of date default current_date)
returns setof public.invoice
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lease record;
  v_allot_status public.allotment_status;
  v_period_months integer;
  v_months integer;
  v_periods integer;
  v_billing_date date;
  v_period_end date;
  v_cycle_key text;
  v_grace integer;
  v_invoice public.invoice;
begin
  -- The scheduler drives this job with the service role (auth.uid() is null). A
  -- logged-in caller must be an Administrator (mirrors transition_allotment).
  if auth.uid() is not null and not public.is_administrator() then
    raise exception 'permission denied: billing cycle job requires Administrator or system role'
      using errcode = '42501';
  end if;

  select payment_grace_period_days into v_grace from public.global_config where id = 1;

  for v_lease in
    select l.id as lease_id,
           l.allotment_id,
           l.start_date,
           l.rent_amount,
           l.billing_cycle,
           a.office_owner_id,
           a.office_unit_id
      from public.lease l
      join public.allotment a on a.id = l.allotment_id
     where a.status = 'ACTIVE'
       and l.start_date <= p_as_of
  loop
    begin
      -- Lock the allotment and re-read its status so a concurrent termination/expiry
      -- is respected (Requirement 8.7).
      select status into v_allot_status
        from public.allotment
       where id = v_lease.allotment_id
         for update;

      if v_allot_status in ('TERMINATED', 'EXPIRED') then
        continue;
      end if;

      v_period_months := case v_lease.billing_cycle
                           when 'MONTHLY' then 1
                           when 'QUARTERLY' then 3
                           when 'YEARLY' then 12
                         end;

      -- Whole months from the lease start to as_of, backing off one month when the
      -- day-of-month anniversary has not yet been reached this month.
      v_months := (extract(year from p_as_of)::int - extract(year from v_lease.start_date)::int) * 12
                + (extract(month from p_as_of)::int - extract(month from v_lease.start_date)::int);
      if extract(day from p_as_of)::int < extract(day from v_lease.start_date)::int then
        v_months := v_months - 1;
      end if;

      v_periods := floor(v_months::numeric / v_period_months)::int;
      if v_periods < 0 then
        continue;  -- billing cycle date not yet reached
      end if;

      v_billing_date := (v_lease.start_date + make_interval(months => v_periods * v_period_months))::date;
      v_period_end := (v_billing_date + make_interval(months => v_period_months) - make_interval(days => 1))::date;
      v_cycle_key := to_char(v_billing_date, 'YYYY-MM-DD');

      -- Pre-check to skip cheaply; the unique constraint is the authoritative guard
      -- against duplicates under concurrency (Requirement 8.6).
      if exists (
        select 1 from public.invoice
         where lease_id = v_lease.lease_id
           and billing_cycle_key = v_cycle_key
      ) then
        continue;
      end if;

      insert into public.invoice (
        lease_id, office_owner_id, office_unit_id, billing_cycle_key,
        billing_period_start, billing_period_end, rent_amount, additional_charges,
        total_amount, due_date, status
      )
      values (
        v_lease.lease_id, v_lease.office_owner_id, v_lease.office_unit_id, v_cycle_key,
        v_billing_date, v_period_end, v_lease.rent_amount, 0,
        v_lease.rent_amount, (v_billing_date + make_interval(days => v_grace))::date, 'DUE'
      )
      returning * into v_invoice;

      -- Same subtransaction as the insert: a failed audit write rolls the invoice back.
      perform public.record_audit('INVOICE_GENERATE', 'invoice', v_invoice.id);

      return next v_invoice;
    exception
      when unique_violation then
        -- A concurrent run already generated this cycle's invoice (Requirement 8.6).
        continue;
      when others then
        -- Isolate the failure to this lease; the rest of the run continues.
        continue;
    end;
  end loop;

  return;
end;
$$;

comment on function public.run_billing_cycle_job is
  'Generates one DUE invoice per active lease whose billing cycle date has been reached, '
  'deduplicated per (lease_id, billing_cycle_key), skipping terminated/expired allotments, '
  'with an INVOICE_GENERATE audit entry per invoice. Requirements 8.1, 8.2, 8.6, 8.7, 14.1';

grant execute on function public.run_billing_cycle_job(date) to authenticated, service_role;
