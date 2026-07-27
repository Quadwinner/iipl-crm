-- Migration: mark_overdue_job function
-- Requirement 8.4
-- Flips any DUE/PARTIALLY_PAID invoice whose due_date has passed to OVERDUE and returns
-- the number of invoices updated. Runs on the same scheduler as run_billing_cycle_job.

create function public.mark_overdue_job(p_as_of date default current_date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  -- Scheduler runs with the service role (auth.uid() is null); a logged-in caller
  -- must be an Administrator.
  if auth.uid() is not null and not public.is_administrator() then
    raise exception 'permission denied: mark overdue job requires Administrator or system role'
      using errcode = '42501';
  end if;

  update public.invoice
     set status = 'OVERDUE'
   where status in ('DUE', 'PARTIALLY_PAID')
     and due_date < p_as_of;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

comment on function public.mark_overdue_job is
  'Transitions DUE/PARTIALLY_PAID invoices past their due_date to OVERDUE; returns the '
  'count updated. Requirement 8.4';

grant execute on function public.mark_overdue_job(date) to authenticated, service_role;
