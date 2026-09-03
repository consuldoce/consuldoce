-- CONSULDOCE registration security migration
-- Run this once in Supabase SQL Editor AFTER the original schema.sql.
-- It validates Portuguese NIFs and prevents duplicate NIF/email records.

create or replace function public.is_valid_portuguese_nif(p_nif text)
returns boolean
language plpgsql immutable as $$
declare
  v text := regexp_replace(coalesce(p_nif,''),'\D','','g');
  total integer := 0;
  i integer;
  check_digit integer;
begin
  if v !~ '^[0-9]{9}$' then return false; end if;
  if v ~ '^([0-9])\1{8}$' then return false; end if;
  for i in 1..8 loop
    total := total + substr(v,i,1)::integer * (9-i);
  end loop;
  if (total % 11) in (0,1) then
    check_digit := 0;
  else
    check_digit := 11 - (total % 11);
  end if;
  return check_digit = substr(v,9,1)::integer;
end;
$$;

create or replace function public.validate_profile_registration()
returns trigger
language plpgsql security definer set search_path=public as $$
begin
  new.email := lower(trim(coalesce(new.email,'')));
  new.nif := regexp_replace(coalesce(new.nif,''),'\D','','g');

  if new.role = 'client' then
    if not public.is_valid_portuguese_nif(new.nif) then
      raise exception 'NIF inválido';
    end if;
  end if;

  if new.email = '' then
    raise exception 'Email obrigatório';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_validate_registration on public.profiles;
create trigger profiles_validate_registration
before insert or update of email,nif,role on public.profiles
for each row execute function public.validate_profile_registration();

-- Existing installations may have empty NIFs for old/admin records, so the
-- unique NIF index is partial and only applies to populated NIF values.
create unique index if not exists profiles_nif_unique_idx
  on public.profiles(nif)
  where nif is not null and nif <> '';

create unique index if not exists profiles_email_lower_unique_idx
  on public.profiles(lower(email))
  where email is not null and trim(email) <> '';

-- Make the registration check available to the browser without exposing rows.
create or replace function public.check_registration(p_email text, p_nif text)
returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  v_email text := lower(trim(coalesce(p_email,'')));
  v_nif text := regexp_replace(coalesce(p_nif,''),'\D','','g');
  email_exists boolean;
  nif_exists boolean;
begin
  select exists(select 1 from public.profiles where lower(email)=v_email) into email_exists;
  select exists(select 1 from public.profiles where nif=v_nif) into nif_exists;
  return jsonb_build_object(
    'valid_nif', public.is_valid_portuguese_nif(v_nif),
    'email_exists', email_exists,
    'nif_exists', nif_exists
  );
end;
$$;
grant execute on function public.check_registration(text,text) to anon, authenticated;
