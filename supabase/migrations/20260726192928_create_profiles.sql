create type public.role as enum ('ADMINISTRATOR', 'MAINTENANCE_STAFF', 'OFFICE_OWNER');

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.role not null default 'OFFICE_OWNER',
  failed_login_count integer not null default 0 check (failed_login_count >= 0),
  locked_until timestamptz,
  last_activity_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

alter table public.profiles enable row level security;

-- SECURITY DEFINER so profiles policies can check the caller's role without
-- re-entering the profiles policies (infinite recursion).
create function public.is_administrator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'ADMINISTRATOR'
  );
$$;

create policy profiles_select_self on public.profiles
  for select to authenticated
  using (user_id = auth.uid());

create policy profiles_select_admin on public.profiles
  for select to authenticated
  using (public.is_administrator());

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.is_administrator())
  with check (public.is_administrator());

-- Privilege escalation guard: RLS cannot scope an UPDATE to a subset of columns,
-- so role changes are gated here rather than in profiles_update_self.
create function public.enforce_profile_role_change()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role
     and current_user not in ('postgres', 'supabase_admin', 'service_role')
     and not public.is_administrator() then
    raise exception 'insufficient privilege to change profiles.role';
  end if;
  return new;
end;
$$;

create trigger profiles_role_change_guard
  before update on public.profiles
  for each row execute function public.enforce_profile_role_change();

create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.role;
begin
  begin
    v_role := coalesce(nullif(new.raw_user_meta_data ->> 'role', ''), 'OFFICE_OWNER')::public.role;
  exception
    when invalid_text_representation then
      v_role := 'OFFICE_OWNER';
  end;

  insert into public.profiles (user_id, role)
  values (new.id, v_role)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

revoke all on public.profiles from anon;
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
grant execute on function public.is_administrator() to authenticated, service_role;
