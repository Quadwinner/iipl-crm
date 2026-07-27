-- Migration: configure_file_types RPC
-- Task 12.3
-- Requirements 13.4
-- Administrator-only upsert of a file_storage_config row: extension, mime type,
-- file_type_accepted flag, and max_file_size_mb.

create function public.configure_file_types(
  p_file_extension text,
  p_mime_type text,
  p_file_type_accepted boolean,
  p_max_file_size_mb integer
)
returns public.file_storage_config
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.file_storage_config;
begin
  perform public.require_permission('CONFIG_MANAGE');

  if p_file_extension is null or char_length(p_file_extension) not between 1 and 20 then
    raise exception 'file extension must be 1-20 characters' using errcode = '22023';
  end if;

  if p_mime_type is null or char_length(p_mime_type) not between 1 and 255 then
    raise exception 'mime type must be 1-255 characters' using errcode = '22023';
  end if;

  if p_max_file_size_mb is null or p_max_file_size_mb <= 0 then
    raise exception 'max file size must be a positive whole number of megabytes'
      using errcode = '22023';
  end if;

  insert into public.file_storage_config (
    file_extension, mime_type, file_type_accepted, max_file_size_mb
  )
  values (
    lower(p_file_extension),
    lower(p_mime_type),
    coalesce(p_file_type_accepted, true),
    p_max_file_size_mb
  )
  on conflict (file_extension) do update
    set mime_type = excluded.mime_type,
        file_type_accepted = excluded.file_type_accepted,
        max_file_size_mb = excluded.max_file_size_mb,
        updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

comment on function public.configure_file_types is
  'Administrator-only upsert of a per-extension file_storage_config row '
  '(extension, mime type, file_type_accepted, max_file_size_mb). Requirement 13.4';

grant execute on function public.configure_file_types(text, text, boolean, integer)
  to authenticated, service_role;
