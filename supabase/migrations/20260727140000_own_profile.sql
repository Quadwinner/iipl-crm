-- Migration: self-service display name for Company_Staff
-- Requirements 5.3, 7.2, 14.1
-- Complaint history and assignee labels resolve through actor_display_name(), which falls
-- back to a role label when profiles.full_name is null. Accounts provisioned outside the
-- staff form (seeded administrators) had no way to set that name.

create function public.update_my_profile(p_full_name text, p_phone text)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_name text := btrim(coalesce(p_full_name, ''));
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
  v_row public.profiles;
begin
  if char_length(v_name) not between 1 and 100 then
    raise exception 'name must be 1-100 characters' using errcode = '22023';
  end if;

  if v_phone is not null and (char_length(v_phone) not between 10 and 15 or v_phone !~ '^\d+$') then
    raise exception 'phone must be 10-15 digits' using errcode = '22023';
  end if;

  update public.profiles
     set full_name = v_name,
         phone = v_phone
   where user_id = auth.uid()
  returning * into v_row;

  if v_row.user_id is null then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'user_id', v_row.user_id,
    'full_name', v_row.full_name,
    'phone', v_row.phone,
    'role', v_row.role
  );
end;
$$;

comment on function public.update_my_profile(text, text) is
  'Lets the signed-in user set their own display name and phone. security invoker so the '
  'profiles_update_self policy is the enforcement; only these two columns are written, so '
  'is_active cannot be self-restored. Requirements 5.3, 7.2';

grant execute on function public.update_my_profile(text, text) to authenticated;
