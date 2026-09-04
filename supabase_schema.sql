-- CONSULDOCE B2B CATALOG — COMPLETE SUPABASE SCHEMA
-- Execute this file once in the Supabase SQL Editor for a fresh project.
-- This is the single canonical database definition for the application.
-- Never put the Supabase service_role key in the website or config.js.

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Types
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('client','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('new','processing','completed','cancelled');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- Profiles / clients
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null default '',
  nif text not null default '',
  address text not null default '',
  phone_country_code text not null default '+351',
  phone_number text not null default '',
  address_line1 text not null default '',
  address_line2 text not null default '',
  postal_code text not null default '',
  postal_locality text not null default '',
  country text not null default 'Portugal',
  role public.user_role not null default 'client',
  must_change_password boolean not null default false,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Catalogue
-- sku is the human-facing product ID/reference imported from Sage.
-- stock_quantity is physical/informational stock.
-- in_stock is the administrator-controlled catalogue availability flag.
-- catalog_price is internal only and is never exposed by the customer UI.
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  short_description text,
  category text,
  barcode text,
  unit text not null default 'UNI',
  stock_quantity numeric not null default 0 check (stock_quantity >= 0),
  track_stock boolean not null default true,
  in_stock boolean not null default false,
  catalog_price numeric,
  image_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_active_category_idx on public.products(active, category);
create index if not exists products_in_stock_idx on public.products(active, in_stock, category);
create index if not exists products_sku_idx on public.products(sku);
create index if not exists products_barcode_idx on public.products(barcode);
create index if not exists products_name_idx on public.products using gin (to_tsvector('simple', name));

-- Customer-safe catalogue view: deliberately excludes catalog_price.
-- Customers use this view; administrators can use the base products table.
-- The base table itself is admin-readable only, preventing clients from querying
-- hidden internal fields such as catalog_price or physical stock quantity.
drop view if exists public.catalog_products;
create view public.catalog_products
as
select id, sku, name, short_description, category, barcode, unit,
       in_stock, image_url, active, sort_order,
       created_at, updated_at
from public.products
where active = true;

grant select on public.catalog_products to authenticated;

-- Customer catalogue RPC: the browser calls this function instead of querying
-- the products table/view directly. It deliberately exposes no price and no
-- physical stock quantity. SECURITY DEFINER lets it read the protected products
-- table while returning only the approved customer-facing columns.
drop function if exists public.get_catalog_products();

create or replace function public.get_catalog_products(p_only_in_stock boolean default false)
returns table (
  id uuid,
  sku text,
  name text,
  short_description text,
  category text,
  barcode text,
  unit text,
  in_stock boolean,
  image_url text,
  active boolean,
  sort_order integer,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.sku, p.name, p.short_description, p.category, p.barcode,
         p.unit, p.in_stock, p.image_url, p.active, p.sort_order,
         p.created_at, p.updated_at
  from public.products p
  where p.active = true
    and (coalesce(p_only_in_stock, false) = false or p.in_stock is true)
  order by p.sort_order, p.name, p.sku;
$$;

revoke execute on function public.get_catalog_products() from public;
grant execute on function public.get_catalog_products() to authenticated;

-- -----------------------------------------------------------------------------
-- Common functions / triggers
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
before update on public.products
for each row execute function public.touch_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- -----------------------------------------------------------------------------
-- Lista fechada de países (mantida sincronizada com ADDRESS_COUNTRIES em app.js)
-- Usada para restringir profiles.country / customer_addresses.country /
-- orders.delivery_country a valores válidos e evitar dados livres/arbitrários.
-- -----------------------------------------------------------------------------
create table if not exists public.countries (
  name text primary key
);
grant select on public.countries to authenticated;

insert into public.countries(name) values
  ('Afeganistão'), ('Alanda'), ('Albânia'), ('Alemanha'), ('Andorra'), ('Angola'),
  ('Anguila'), ('Antártida'), ('Antígua e Barbuda'), ('Argentina'), ('Argélia'), ('Arménia'),
  ('Aruba'), ('Arábia Saudita'), ('Austrália'), ('Azerbaijão'), ('Baamas'), ('Bangladeche'),
  ('Barbados'), ('Barém'), ('Belize'), ('Benim'), ('Bermudas'), ('Bielorrússia'),
  ('Bolívia'), ('Botsuana'), ('Brasil'), ('Brunei'), ('Bulgária'), ('Burquina Faso'),
  ('Burundi'), ('Butão'), ('Bélgica'), ('Bósnia e Herzegovina'), ('Cabo Verde'), ('Camarões'),
  ('Camboja'), ('Canadá'), ('Catar'), ('Cazaquistão'), ('Chade'), ('Chile'),
  ('China'), ('Chipre'), ('Chéquia'), ('Cidade do Vaticano'), ('Colômbia'), ('Comores'),
  ('Congo-Brazzaville'), ('Congo-Kinshasa'), ('Coreia do Norte'), ('Coreia do Sul'), ('Costa Rica'), ('Croácia'),
  ('Cuba'), ('Curaçau'), ('Côte d’Ivoire (Costa do Marfim)'), ('Dinamarca'), ('Domínica'), ('Egito'),
  ('Emirados Árabes Unidos'), ('Equador'), ('Eritreia'), ('Eslováquia'), ('Eslovénia'), ('Espanha'),
  ('Essuatíni'), ('Estados Unidos'), ('Estónia'), ('Etiópia'), ('Fiji'), ('Filipinas'),
  ('Finlândia'), ('França'), ('Gabão'), ('Gana'), ('Geórgia'), ('Gibraltar'),
  ('Granada'), ('Gronelândia'), ('Grécia'), ('Guadalupe'), ('Guame'), ('Guatemala'),
  ('Guernesey'), ('Guiana'), ('Guiana Francesa'), ('Guiné'), ('Guiné Equatorial'), ('Guiné-Bissau'),
  ('Gâmbia'), ('Haiti'), ('Honduras'), ('Hong Kong, RAE da China'), ('Hungria'), ('Ilha Bouvet'),
  ('Ilha Norfolk'), ('Ilha de Man'), ('Ilha do Natal'), ('Ilhas Caimão'), ('Ilhas Cook'), ('Ilhas Falkland'),
  ('Ilhas Faroé'), ('Ilhas Geórgia do Sul e Sandwich do Sul'), ('Ilhas Heard e McDonald'), ('Ilhas Marianas do Norte'), ('Ilhas Marshall'), ('Ilhas Menores Afastadas dos EUA'),
  ('Ilhas Pitcairn'), ('Ilhas Salomão'), ('Ilhas Turcas e Caicos'), ('Ilhas Virgens Britânicas'), ('Ilhas Virgens dos EUA'), ('Ilhas dos Cocos (Keeling)'),
  ('Indonésia'), ('Iraque'), ('Irlanda'), ('Irão'), ('Islândia'), ('Israel'),
  ('Itália'), ('Iémen'), ('Jamaica'), ('Japão'), ('Jersey'), ('Jibuti'),
  ('Jordânia'), ('Koweit'), ('Laos'), ('Lesoto'), ('Letónia'), ('Libéria'),
  ('Listenstaine'), ('Lituânia'), ('Luxemburgo'), ('Líbano'), ('Líbia'), ('Macau, RAE da China'),
  ('Macedónia do Norte'), ('Madagáscar'), ('Maiote'), ('Maldivas'), ('Mali'), ('Malta'),
  ('Malásia'), ('Maláui'), ('Marrocos'), ('Martinica'), ('Mauritânia'), ('Maurícia'),
  ('Mianmar (Birmânia)'), ('Micronésia'), ('Moldávia'), ('Mongólia'), ('Monserrate'), ('Montenegro'),
  ('Moçambique'), ('México'), ('Mónaco'), ('Namíbia'), ('Nauru'), ('Nepal'),
  ('Nicarágua'), ('Nigéria'), ('Niuê'), ('Noruega'), ('Nova Caledónia'), ('Nova Zelândia'),
  ('Níger'), ('Omã'), ('Palau'), ('Panamá'), ('Papua-Nova Guiné'), ('Paquistão'),
  ('Paraguai'), ('Países Baixos'), ('Países Baixos Caribenhos'), ('Peru'), ('Polinésia Francesa'), ('Polónia'),
  ('Porto Rico'), ('Portugal'), ('Quirguistão'), ('Quiribáti'), ('Quénia'), ('Reino Unido'),
  ('República Centro-Africana'), ('República Dominicana'), ('Reunião'), ('Roménia'), ('Ruanda'), ('Rússia'),
  ('Salvador'), ('Samoa'), ('Samoa Americana'), ('Santa Helena'), ('Santa Lúcia'), ('Sara Ocidental'),
  ('Seicheles'), ('Senegal'), ('Serra Leoa'), ('Singapura'), ('Somália'), ('Sri Lanca'),
  ('Sudão'), ('Sudão do Sul'), ('Suriname'), ('Suécia'), ('Suíça'), ('Svalbard e Jan Mayen'),
  ('São Bartolomeu'), ('São Cristóvão e Neves'), ('São Marinho'), ('São Martinho (Saint-Martin)'), ('São Martinho (Sint Maarten)'), ('São Pedro e Miquelão'),
  ('São Tomé e Príncipe'), ('São Vicente e Granadinas'), ('Sérvia'), ('Síria'), ('Tailândia'), ('Taiwan'),
  ('Tajiquistão'), ('Tanzânia'), ('Território Britânico do Oceano Índico'), ('Territórios Austrais Franceses'), ('Territórios palestinianos'), ('Timor-Leste'),
  ('Togo'), ('Tonga'), ('Toquelau'), ('Trindade e Tobago'), ('Tunísia'), ('Turquemenistão'),
  ('Turquia'), ('Tuvalu'), ('Ucrânia'), ('Uganda'), ('Uruguai'), ('Usbequistão'),
  ('Vanuatu'), ('Venezuela'), ('Vietname'), ('Wallis e Futuna'), ('Zimbabué'), ('Zâmbia'),
  ('África do Sul'), ('Áustria'), ('Índia')
on conflict (name) do nothing;

-- -----------------------------------------------------------------------------
-- Validação de NIF / número de identificação fiscal por país (servidor)
-- Espelha a lógica client-side em app.js. Isto é uma segunda linha de defesa:
-- a validação nunca deve depender só do browser, porque qualquer pessoa pode
-- chamar a API REST/RPC do Supabase diretamente com a chave publishable.
-- Algoritmos oficiais de dígito de controlo onde documentados publicamente;
-- para os restantes países aplica-se uma validação de formato.
-- -----------------------------------------------------------------------------
create or replace function public.normalize_tax_id(v text)
returns text language sql immutable as $$
  select upper(regexp_replace(coalesce(v,''), '[^0-9A-Za-z]', '', 'g'));
$$;

create or replace function public.normalize_nif_digits(v text)
returns text language sql immutable as $$
  select regexp_replace(coalesce(v,''), '[^0-9]', '', 'g');
$$;

create or replace function public.is_valid_mod11_nif9(value text)
returns boolean language plpgsql immutable as $$
declare
  nif text := public.normalize_nif_digits(value);
  i int; sum int := 0; remainder int; check_digit int;
  weights int[] := array[9,8,7,6,5,4,3,2];
begin
  if length(nif) <> 9 then return false; end if;
  if nif !~ '^[1-9][0-9]{8}$' then return false; end if;
  if nif ~ '^(\d)\1{8}$' then return false; end if;
  for i in 1..8 loop
    sum := sum + (substr(nif,i,1)::int) * weights[i];
  end loop;
  remainder := sum % 11;
  check_digit := case when remainder < 2 then 0 else 11-remainder end;
  return check_digit = substr(nif,9,1)::int;
end;
$$;

create or replace function public.is_valid_spanish_nif(value text)
returns boolean language plpgsql immutable as $$
declare
  v text := public.normalize_tax_id(value);
  letters text := 'TRWAGMYFPDXBNJZSQVHLCKE';
  num bigint; map_char char(1);
  letter char(1); digits text; control text;
  i int; d int; n int; sum_odd int := 0; sum_even int := 0; total int; unit int;
  control_digit int; control_letter char(1);
begin
  if v ~ '^[0-9]{8}[A-Z]$' then
    num := substr(v,1,8)::bigint;
    return substr(v,9,1) = substr(letters, (num % 23)::int + 1, 1);
  end if;
  if v ~ '^[XYZ][0-9]{7}[A-Z]$' then
    map_char := case substr(v,1,1) when 'X' then '0' when 'Y' then '1' else '2' end;
    num := (map_char || substr(v,2,7))::bigint;
    return substr(v,9,1) = substr(letters, (num % 23)::int + 1, 1);
  end if;
  if v ~ '^[ABCDEFGHJKLMNPQRSUVW][0-9]{7}[0-9A-J]$' then
    letter := substr(v,1,1);
    digits := substr(v,2,7);
    control := substr(v,9,1);
    for i in 1..7 loop
      d := substr(digits,i,1)::int;
      if i % 2 = 1 then
        n := d*2; if n>9 then n := n-9; end if;
        sum_odd := sum_odd + n;
      else
        sum_even := sum_even + d;
      end if;
    end loop;
    total := sum_odd + sum_even;
    unit := total % 10;
    control_digit := case when unit=0 then 0 else 10-unit end;
    control_letter := substr('JABCDEFGHI', control_digit+1, 1);
    if letter in ('N','P','Q','R','S','W') then
      return control = control_letter;
    elsif letter in ('A','B','E','H') then
      return control = control_digit::text;
    else
      return control = control_digit::text or control = control_letter;
    end if;
  end if;
  return false;
end;
$$;

create or replace function public.is_valid_french_nif(value text)
returns boolean language plpgsql immutable as $$
declare
  v text := public.normalize_tax_id(value);
  key text; siren text; expected int;
begin
  if v !~ '^[0-9A-Z]{2}[0-9]{9}$' then return false; end if;
  key := substr(v,1,2);
  siren := substr(v,3,9);
  if key ~ '^[0-9]{2}$' then
    expected := ((12 + 3*(siren::bigint % 97)) % 97)::int;
    return key::int = expected;
  end if;
  return true;
end;
$$;

create or replace function public.is_valid_italian_partita_iva(value text)
returns boolean language plpgsql immutable as $$
declare
  v text := public.normalize_nif_digits(value);
  i int; d int; sum int := 0;
begin
  if length(v) <> 11 then return false; end if;
  for i in 0..9 loop
    d := substr(v, i+1, 1)::int;
    if i % 2 = 1 then
      d := d*2; if d>9 then d := d-9; end if;
    end if;
    sum := sum + d;
  end loop;
  return ((10 - (sum % 10)) % 10) = substr(v,11,1)::int;
end;
$$;

create or replace function public.is_valid_german_vat(value text)
returns boolean language plpgsql immutable as $$
declare
  v text := public.normalize_nif_digits(value);
  i int; product int := 10; sum int; check_digit int;
begin
  if length(v) <> 9 then return false; end if;
  for i in 0..7 loop
    sum := (substr(v,i+1,1)::int + product) % 10;
    if sum = 0 then sum := 10; end if;
    product := (2*sum) % 11;
  end loop;
  check_digit := (11-product) % 10;
  return check_digit = substr(v,9,1)::int;
end;
$$;

create or replace function public.is_valid_uk_vat(value text)
returns boolean language plpgsql immutable as $$
declare
  raw text := upper(trim(coalesce(value,'')));
  v text := public.normalize_nif_digits(value);
  weights int[] := array[8,7,6,5,4,3,2];
  i int; sum int; chk int; total int;
begin
  if raw ~ '^(GD|HA)[0-9]{3}$' then return true; end if;
  if length(v) = 12 then v := substr(v,1,9); end if;
  if length(v) <> 9 then return false; end if;
  sum := 0;
  for i in 1..7 loop
    sum := sum + substr(v,i,1)::int * weights[i];
  end loop;
  chk := substr(v,8,2)::int;
  total := sum+chk;
  if total % 97 = 0 then return true; end if;
  total := sum+chk-55;
  return total % 97 = 0;
end;
$$;

create or replace function public.is_valid_dutch_vat(value text)
returns boolean language plpgsql immutable as $$
declare
  v text := public.normalize_tax_id(value);
  digits text;
  weights int[] := array[9,8,7,6,5,4,3,2];
  i int; sum int := 0;
begin
  if v ~ '^[0-9]{9}B[0-9]{2}$' then
    digits := substr(v,1,9);
  elsif v ~ '^[0-9]{9}$' then
    digits := v;
  else
    return false;
  end if;
  for i in 1..8 loop
    sum := sum + substr(digits,i,1)::int * weights[i];
  end loop;
  return (sum % 11) = substr(digits,9,1)::int;
end;
$$;

create or replace function public.is_valid_belgian_vat(value text)
returns boolean language plpgsql immutable as $$
declare
  v text := public.normalize_nif_digits(value);
  base int; chk int;
begin
  if length(v) = 9 then v := '0' || v; end if;
  if length(v) <> 10 then return false; end if;
  if substr(v,1,1) not in ('0','1') then return false; end if;
  base := substr(v,1,8)::int;
  chk := substr(v,9,2)::int;
  return (97 - (base % 97)) = chk;
end;
$$;

create or replace function public.cnpj_check_digit(base text)
returns int language plpgsql immutable as $$
declare
  weights int[];
  i int; sum int := 0; r int;
begin
  if length(base) = 12 then
    weights := array[5,4,3,2,9,8,7,6,5,4,3,2];
  else
    weights := array[6,5,4,3,2,9,8,7,6,5,4,3,2];
  end if;
  for i in 1..length(base) loop
    sum := sum + substr(base,i,1)::int * weights[i];
  end loop;
  r := sum % 11;
  return case when r<2 then 0 else 11-r end;
end;
$$;

create or replace function public.is_valid_cpf(v text)
returns boolean language plpgsql immutable as $$
declare
  i int; sum int; d1 int; d2 int;
begin
  if length(v) <> 11 or v ~ '^(\d)\1{10}$' then return false; end if;
  sum := 0;
  for i in 0..8 loop
    sum := sum + substr(v,i+1,1)::int * (10-i);
  end loop;
  d1 := (sum*10) % 11; if d1=10 then d1:=0; end if;
  if d1 <> substr(v,10,1)::int then return false; end if;
  sum := 0;
  for i in 0..9 loop
    sum := sum + substr(v,i+1,1)::int * (11-i);
  end loop;
  d2 := (sum*10) % 11; if d2=10 then d2:=0; end if;
  return d2 = substr(v,11,1)::int;
end;
$$;

create or replace function public.is_valid_cnpj(v text)
returns boolean language plpgsql immutable as $$
begin
  if length(v) <> 14 or v ~ '^(\d)\1{13}$' then return false; end if;
  if public.cnpj_check_digit(substr(v,1,12)) <> substr(v,13,1)::int then return false; end if;
  return public.cnpj_check_digit(substr(v,1,13)) = substr(v,14,1)::int;
end;
$$;

create or replace function public.is_valid_brazilian_nif(value text)
returns boolean language plpgsql immutable as $$
declare v text := public.normalize_nif_digits(value);
begin
  if length(v) = 11 then return public.is_valid_cpf(v); end if;
  if length(v) = 14 then return public.is_valid_cnpj(v); end if;
  return false;
end;
$$;

create or replace function public.is_valid_generic_tax_id(value text)
returns boolean language sql immutable as $$
  select length(public.normalize_tax_id(value)) between 5 and 20
     and public.normalize_tax_id(value) ~ '[0-9]';
$$;

-- Despachante: escolhe a regra pelo nome do país (mesmos nomes usados em ADDRESS_COUNTRIES).
create or replace function public.is_valid_nif_for_country(value text, country text)
returns boolean language plpgsql immutable as $$
declare c text := trim(coalesce(country,''));
begin
  if trim(coalesce(value,'')) = '' then return false; end if;
  if c = 'Portugal' then return public.is_valid_mod11_nif9(value);
  elsif c = 'Cabo Verde' then return public.is_valid_mod11_nif9(value);
  elsif c = 'Espanha' then return public.is_valid_spanish_nif(value);
  elsif c = 'França' then return public.is_valid_french_nif(value);
  elsif c = 'Itália' then return public.is_valid_italian_partita_iva(value);
  elsif c = 'Alemanha' then return public.is_valid_german_vat(value);
  elsif c = 'Reino Unido' then return public.is_valid_uk_vat(value);
  elsif c = 'Países Baixos' then return public.is_valid_dutch_vat(value);
  elsif c = 'Bélgica' then return public.is_valid_belgian_vat(value);
  elsif c = 'Brasil' then return public.is_valid_brazilian_nif(value);
  else return public.is_valid_generic_tax_id(value);
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Robustez de dados: limites de tamanho e país como lista fechada.
-- O maxlength do formulário HTML é só uma conveniência de UX — qualquer
-- chamada direta à API REST podia até aqui submeter strings arbitrariamente
-- grandes ou um país inventado. Isto aplica os mesmos limites do lado do
-- servidor, independentemente de como o pedido chega.
-- -----------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_full_name_len_chk;
alter table public.profiles add constraint profiles_full_name_len_chk check (char_length(full_name) <= 200);
alter table public.profiles drop constraint if exists profiles_nif_len_chk;
alter table public.profiles add constraint profiles_nif_len_chk check (char_length(nif) <= 20);
alter table public.profiles drop constraint if exists profiles_phone_number_len_chk;
alter table public.profiles add constraint profiles_phone_number_len_chk check (char_length(phone_number) <= 30);
alter table public.profiles drop constraint if exists profiles_phone_country_code_len_chk;
alter table public.profiles add constraint profiles_phone_country_code_len_chk check (char_length(phone_country_code) <= 10);
alter table public.profiles drop constraint if exists profiles_address_line1_len_chk;
alter table public.profiles add constraint profiles_address_line1_len_chk check (char_length(address_line1) <= 250);
alter table public.profiles drop constraint if exists profiles_address_line2_len_chk;
alter table public.profiles add constraint profiles_address_line2_len_chk check (char_length(address_line2) <= 150);
alter table public.profiles drop constraint if exists profiles_postal_code_len_chk;
alter table public.profiles add constraint profiles_postal_code_len_chk check (char_length(postal_code) <= 20);
alter table public.profiles drop constraint if exists profiles_postal_locality_len_chk;
alter table public.profiles add constraint profiles_postal_locality_len_chk check (char_length(postal_locality) <= 120);
alter table public.profiles drop constraint if exists profiles_country_fkey;
alter table public.profiles add constraint profiles_country_fkey foreign key (country) references public.countries(name);

alter table public.products drop constraint if exists products_name_len_chk;
alter table public.products add constraint products_name_len_chk check (char_length(name) <= 200);
alter table public.products drop constraint if exists products_sku_len_chk;
alter table public.products add constraint products_sku_len_chk check (char_length(sku) <= 60);
alter table public.products drop constraint if exists products_short_description_len_chk;
alter table public.products add constraint products_short_description_len_chk check (short_description is null or char_length(short_description) <= 500);
alter table public.products drop constraint if exists products_category_len_chk;
alter table public.products add constraint products_category_len_chk check (category is null or char_length(category) <= 120);
alter table public.products drop constraint if exists products_barcode_len_chk;
alter table public.products add constraint products_barcode_len_chk check (barcode is null or char_length(barcode) <= 60);
alter table public.products drop constraint if exists products_unit_len_chk;
alter table public.products add constraint products_unit_len_chk check (char_length(unit) <= 20);

-- -----------------------------------------------------------------------------
-- Customer addresses
-- A client may have multiple delivery addresses, with exactly one preferred
-- address whenever at least one address exists. Orders store a snapshot so
-- changing a saved address later never changes historical orders.
-- -----------------------------------------------------------------------------
create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'Morada',
  address_line1 text not null default '',
  address_line2 text not null default '',
  postal_code text not null default '',
  postal_locality text not null default '',
  country text not null default 'Portugal',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customer_addresses_client_idx on public.customer_addresses(client_id, created_at);
create unique index if not exists customer_addresses_one_default_idx on public.customer_addresses(client_id) where is_default = true;

create or replace function public.customer_addresses_default_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.is_default or not exists(select 1 from public.customer_addresses where client_id=new.client_id) then
      update public.customer_addresses set is_default=false where client_id=new.client_id;
      new.is_default := true;
    end if;
  elsif tg_op = 'UPDATE' then
    if new.is_default then
      update public.customer_addresses set is_default=false where client_id=new.client_id and id<>new.id;
    elsif old.is_default and new.client_id=old.client_id then
      new.is_default := true;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists customer_addresses_default_guard on public.customer_addresses;
create trigger customer_addresses_default_guard
before insert or update on public.customer_addresses
for each row execute function public.customer_addresses_default_guard();

create or replace function public.customer_addresses_before_delete()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if old.is_default and not exists(select 1 from public.customer_addresses where client_id=old.client_id and id<>old.id) then
    raise exception 'A conta tem de ter uma morada predefinida.';
  end if;
  return old;
end; $$;
drop trigger if exists customer_addresses_before_delete on public.customer_addresses;
create trigger customer_addresses_before_delete before delete on public.customer_addresses for each row execute function public.customer_addresses_before_delete();

create or replace function public.customer_addresses_after_delete()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if old.is_default then
    update public.customer_addresses set is_default=true where id=(select id from public.customer_addresses where client_id=old.client_id order by created_at,id limit 1);
  end if;
  return old;
end; $$;
drop trigger if exists customer_addresses_after_delete on public.customer_addresses;
create trigger customer_addresses_after_delete after delete on public.customer_addresses for each row execute function public.customer_addresses_after_delete();

drop trigger if exists customer_addresses_touch on public.customer_addresses;
create trigger customer_addresses_touch before update on public.customer_addresses for each row execute function public.touch_updated_at();

alter table public.customer_addresses enable row level security;
drop policy if exists customer_addresses_select on public.customer_addresses;
create policy customer_addresses_select on public.customer_addresses for select to authenticated using (client_id=auth.uid() or public.is_admin());
drop policy if exists customer_addresses_insert on public.customer_addresses;
create policy customer_addresses_insert on public.customer_addresses for insert to authenticated with check (client_id=auth.uid() or public.is_admin());
drop policy if exists customer_addresses_update on public.customer_addresses;
create policy customer_addresses_update on public.customer_addresses for update to authenticated using (client_id=auth.uid() or public.is_admin()) with check (client_id=auth.uid() or public.is_admin());
drop policy if exists customer_addresses_delete on public.customer_addresses;
create policy customer_addresses_delete on public.customer_addresses for delete to authenticated using (client_id=auth.uid() or public.is_admin());

create or replace function public.set_default_customer_address(p_address_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_client uuid;
begin
  select client_id into v_client from public.customer_addresses where id=p_address_id;
  if v_client is null or (v_client<>auth.uid() and not public.is_admin()) then raise exception 'Morada não encontrada'; end if;
  update public.customer_addresses set is_default=false where client_id=v_client;
  update public.customer_addresses set is_default=true where id=p_address_id;
end;
$$;
grant execute on function public.set_default_customer_address(uuid) to authenticated;

-- Backfill the current profile address into the address book. Safe to run more than once.
insert into public.customer_addresses(client_id,label,address_line1,address_line2,postal_code,postal_locality,country,is_default)
select p.id,'Principal',p.address_line1,p.address_line2,p.postal_code,p.postal_locality,p.country,true
from public.profiles p
where not exists(select 1 from public.customer_addresses a where a.client_id=p.id)
  and (coalesce(p.address_line1,'')<>'' or coalesce(p.address_line2,'')<>'' or coalesce(p.postal_code,'')<>'' or coalesce(p.postal_locality,'')<>'');


-- -----------------------------------------------------------------------------
-- Orders
-- -----------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles(id) on delete set null,
  client_name_snapshot text not null default '',
  client_email_snapshot text not null default '',
  client_nif_snapshot text not null default '',
  status public.order_status not null default 'new',
  notes text,
  delivery_address_id uuid references public.customer_addresses(id) on delete set null,
  delivery_address_label text not null default '',
  delivery_address_line1 text not null default '',
  delivery_address_line2 text not null default '',
  delivery_postal_code text not null default '',
  delivery_postal_locality text not null default '',
  delivery_country text not null default 'Portugal',
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  sku text not null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create index if not exists orders_client_created_idx on public.orders(client_id, created_at desc);
create index if not exists order_items_order_idx on public.order_items(order_id);

alter table public.customer_addresses drop constraint if exists customer_addresses_label_len_chk;
alter table public.customer_addresses add constraint customer_addresses_label_len_chk check (char_length(label) <= 100);
alter table public.customer_addresses drop constraint if exists customer_addresses_address_line1_len_chk;
alter table public.customer_addresses add constraint customer_addresses_address_line1_len_chk check (char_length(address_line1) <= 250);
alter table public.customer_addresses drop constraint if exists customer_addresses_address_line2_len_chk;
alter table public.customer_addresses add constraint customer_addresses_address_line2_len_chk check (char_length(address_line2) <= 150);
alter table public.customer_addresses drop constraint if exists customer_addresses_postal_code_len_chk;
alter table public.customer_addresses add constraint customer_addresses_postal_code_len_chk check (char_length(postal_code) <= 20);
alter table public.customer_addresses drop constraint if exists customer_addresses_postal_locality_len_chk;
alter table public.customer_addresses add constraint customer_addresses_postal_locality_len_chk check (char_length(postal_locality) <= 120);
alter table public.customer_addresses drop constraint if exists customer_addresses_country_fkey;
alter table public.customer_addresses add constraint customer_addresses_country_fkey foreign key (country) references public.countries(name);

alter table public.orders drop constraint if exists orders_notes_len_chk;
alter table public.orders add constraint orders_notes_len_chk check (notes is null or char_length(notes) <= 1000);
alter table public.orders drop constraint if exists orders_delivery_address_label_len_chk;
alter table public.orders add constraint orders_delivery_address_label_len_chk check (char_length(delivery_address_label) <= 100);
alter table public.orders drop constraint if exists orders_delivery_address_line1_len_chk;
alter table public.orders add constraint orders_delivery_address_line1_len_chk check (char_length(delivery_address_line1) <= 250);
alter table public.orders drop constraint if exists orders_delivery_address_line2_len_chk;
alter table public.orders add constraint orders_delivery_address_line2_len_chk check (char_length(delivery_address_line2) <= 150);
alter table public.orders drop constraint if exists orders_delivery_postal_code_len_chk;
alter table public.orders add constraint orders_delivery_postal_code_len_chk check (char_length(delivery_postal_code) <= 20);
alter table public.orders drop constraint if exists orders_delivery_postal_locality_len_chk;
alter table public.orders add constraint orders_delivery_postal_locality_len_chk check (char_length(delivery_postal_locality) <= 120);
alter table public.orders drop constraint if exists orders_delivery_country_fkey;
alter table public.orders add constraint orders_delivery_country_fkey foreign key (delivery_country) references public.countries(name);

-- Limite superior de quantidade por artigo, para evitar encomendas absurdas
-- (por engano ou abuso) — o limite "amigável" com mensagem clara está também
-- aplicado dentro de create_order() mais abaixo.
alter table public.order_items drop constraint if exists order_items_quantity_max_chk;
alter table public.order_items add constraint order_items_quantity_max_chk check (quantity <= 100000);

-- Customer-account administration support.
alter table public.profiles drop constraint if exists profiles_must_change_password_chk;
alter table public.profiles add constraint profiles_must_change_password_chk check (must_change_password is not null);
alter table public.orders drop constraint if exists orders_client_name_snapshot_len_chk;
alter table public.orders add constraint orders_client_name_snapshot_len_chk check (char_length(client_name_snapshot) <= 150);
alter table public.orders drop constraint if exists orders_client_email_snapshot_len_chk;
alter table public.orders add constraint orders_client_email_snapshot_len_chk check (char_length(client_email_snapshot) <= 255);
alter table public.orders drop constraint if exists orders_client_nif_snapshot_len_chk;
alter table public.orders add constraint orders_client_nif_snapshot_len_chk check (char_length(client_nif_snapshot) <= 20);




-- Creates the application profile when Supabase Auth creates a user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(
    id, email, full_name, nif, address,
    phone_country_code, phone_number,
    address_line1, address_line2, postal_code, postal_locality, country,
    role
  )
  values (
    new.id,
    lower(trim(coalesce(new.email,''))),
    coalesce(new.raw_user_meta_data->>'full_name',''),
    regexp_replace(upper(coalesce(new.raw_user_meta_data->>'nif','')),'[^0-9A-Z]','','g'),
    trim(concat_ws(', ',
      nullif(trim(coalesce(new.raw_user_meta_data->>'address_line1','')),''),
      nullif(trim(coalesce(new.raw_user_meta_data->>'address_line2','')),''),
      nullif(trim(coalesce(new.raw_user_meta_data->>'postal_code','')),''),
      nullif(trim(coalesce(new.raw_user_meta_data->>'postal_locality','')),''),
      nullif(trim(coalesce(new.raw_user_meta_data->>'country','Portugal')),'')
    )),
    coalesce(nullif(trim(new.raw_user_meta_data->>'phone_country_code'),''), '+351'),
    trim(coalesce(new.raw_user_meta_data->>'phone_number','')),
    trim(coalesce(new.raw_user_meta_data->>'address_line1','')),
    trim(coalesce(new.raw_user_meta_data->>'address_line2','')),
    trim(coalesce(new.raw_user_meta_data->>'postal_code','')),
    trim(coalesce(new.raw_user_meta_data->>'postal_locality','')),
    coalesce(nullif(trim(new.raw_user_meta_data->>'country'),''), 'Portugal'),
    'client'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    nif = excluded.nif,
    address = excluded.address,
    phone_country_code = excluded.phone_country_code,
    phone_number = excluded.phone_number,
    address_line1 = excluded.address_line1,
    address_line2 = excluded.address_line2,
    postal_code = excluded.postal_code,
    postal_locality = excluded.postal_locality,
    country = excluded.country;

  insert into public.customer_addresses(client_id,label,address_line1,address_line2,postal_code,postal_locality,country,is_default)
  select new.id,'Principal',
    trim(coalesce(new.raw_user_meta_data->>'address_line1','')),
    trim(coalesce(new.raw_user_meta_data->>'address_line2','')),
    trim(coalesce(new.raw_user_meta_data->>'postal_code','')),
    trim(coalesce(new.raw_user_meta_data->>'postal_locality','')),
    coalesce(nullif(trim(new.raw_user_meta_data->>'country'),''),'Portugal'),
    true
  where not exists(select 1 from public.customer_addresses a where a.client_id=new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Registration rules: NIF is mandatory for client profiles and is validated
-- server-side against the official check-digit rule for the profile's country
-- (see is_valid_nif_for_country above). This is a second line of defense:
-- the client-side validation in app.js is for UX only, and must never be the
-- only gate, since anyone can call the Supabase REST/RPC API directly.
-- Duplicate NIF/email values are prevented by unique indexes below.
create or replace function public.validate_profile_registration()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.email := lower(trim(coalesce(new.email,'')));
  new.nif := regexp_replace(upper(coalesce(new.nif,'')),'[^0-9A-Z]','','g');
  new.country := coalesce(nullif(trim(new.country),''), 'Portugal');

  if new.email = '' then
    raise exception 'Email obrigatório';
  end if;

  if new.role = 'client' then
    if new.nif = '' then
      raise exception 'NIF obrigatório';
    end if;
    if not public.is_valid_nif_for_country(new.nif, new.country) then
      raise exception 'NIF inválido para o país indicado (%).', new.country;
    end if;
  end if;

  -- Prevent a normal authenticated user from promoting their own profile.
  if tg_op = 'UPDATE' and new.role is distinct from old.role then
    if auth.uid() is null or not public.is_admin() then
      raise exception 'Alteração de função não permitida';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_validate_registration on public.profiles;
create trigger profiles_validate_registration
before insert or update of email, nif, role, country on public.profiles
for each row execute function public.validate_profile_registration();

create unique index if not exists profiles_nif_unique_idx
on public.profiles(nif)
where nif is not null and nif <> '';

create unique index if not exists profiles_email_lower_unique_idx
on public.profiles(lower(email))
where email is not null and trim(email) <> '';

-- Structured customer contact/address fields. The legacy address column is retained for compatibility.
comment on column public.profiles.phone_country_code is 'Indicativo telefónico internacional, ex. +351';
comment on column public.profiles.phone_number is 'Número de telemóvel sem o indicativo';
comment on column public.profiles.address_line1 is 'Endereço principal';
comment on column public.profiles.address_line2 is 'Andar, lote, fração, porta, etc.';
comment on column public.profiles.postal_code is 'Código postal';
comment on column public.profiles.postal_locality is 'Localidade postal';
comment on column public.profiles.country is 'País da morada';

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select
on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update
on public.profiles for update to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- Nota de segurança: não é criada uma política "profiles_admin_all" com FOR ALL.
-- profiles_select e profiles_update acima já cobrem tudo o que o admin precisa
-- (ver perfis de clientes, editar o seu próprio). Uma política FOR ALL também
-- concederia DELETE/INSERT ao admin via API, o que nunca é necessário aqui —
-- a criação de perfis é feita apenas pelo trigger SECURITY DEFINER
-- handle_new_user(), que ignora RLS — e apagar um perfil diretamente deixaria
-- o utilizador em auth.users "órfão" (sem perfil). Se uma limpeza manual for
-- mesmo necessária, deve ser feita a partir do painel do Supabase.
drop policy if exists profiles_admin_all on public.profiles;

alter table public.products enable row level security;

drop policy if exists products_read on public.products;
create policy products_read
on public.products for select to authenticated
using (public.is_admin());

drop policy if exists products_admin_insert on public.products;
create policy products_admin_insert
on public.products for insert to authenticated
with check (public.is_admin());

drop policy if exists products_admin_update on public.products;
create policy products_admin_update
on public.products for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists products_admin_delete on public.products;
create policy products_admin_delete
on public.products for delete to authenticated
using (public.is_admin());

alter table public.orders enable row level security;

drop policy if exists orders_select on public.orders;
create policy orders_select
on public.orders for select to authenticated
using (client_id = auth.uid() or public.is_admin());

drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update
on public.orders for update to authenticated
using (public.is_admin())
with check (public.is_admin());

alter table public.order_items enable row level security;

drop policy if exists order_items_select on public.order_items;
create policy order_items_select
on public.order_items for select to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and (o.client_id = auth.uid() or public.is_admin())
  )
);

-- -----------------------------------------------------------------------------
-- Atomic order creation
-- Availability is controlled by admin through products.in_stock.
-- Physical stock is informational and is not decremented automatically.
-- -----------------------------------------------------------------------------
create or replace function public.create_order(p_items jsonb, p_notes text default null, p_address_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_product_id uuid;
  v_address public.customer_addresses%rowtype;
begin
  if auth.uid() is null then raise exception 'Não autenticado'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Carrinho vazio'; end if;
  if not exists(select 1 from public.profiles where id=auth.uid() and role in ('client','admin')) then raise exception 'Perfil inválido'; end if;
  if p_address_id is null then raise exception 'Selecione uma morada de entrega'; end if;
  select * into v_address from public.customer_addresses where id=p_address_id and client_id=auth.uid();
  if not found then raise exception 'Morada de entrega inválida'; end if;

  insert into public.orders(client_id, client_name_snapshot, client_email_snapshot, client_nif_snapshot, notes, delivery_address_id, delivery_address_label, delivery_address_line1, delivery_address_line2, delivery_postal_code, delivery_postal_locality, delivery_country)
  select auth.uid(), p.full_name, coalesce(p.email,''), p.nif, nullif(left(coalesce(p_notes,''),1000),''), v_address.id, v_address.label, v_address.address_line1, v_address.address_line2, v_address.postal_code, v_address.postal_locality, v_address.country
  from public.profiles p where p.id=auth.uid()
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    begin
      v_product_id := (v_item->>'product_id')::uuid;
      v_qty := (v_item->>'quantity')::integer;
    exception when others then raise exception 'Item de encomenda inválido'; end;
    if v_qty is null or v_qty <= 0 then raise exception 'Quantidade inválida'; end if;
    if v_qty > 100000 then raise exception 'Quantidade inválida (máximo 100000 unidades por artigo).'; end if;
    select * into v_product from public.products where id=v_product_id and active=true for update;
    if not found then raise exception 'Produto indisponível'; end if;
    if not v_product.in_stock then raise exception 'Produto fora de stock: %',v_product.name; end if;
    insert into public.order_items(order_id,product_id,sku,product_name,quantity) values(v_order_id,v_product.id,v_product.sku,v_product.name,v_qty);
  end loop;
  return v_order_id;
end;
$$;
grant execute on function public.create_order(jsonb,text,uuid) to authenticated;


-- -----------------------------------------------------------------------------
-- Product image storage
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read
on storage.objects for select
using (bucket_id = 'product-images');

drop policy if exists product_images_admin_insert on storage.objects;
create policy product_images_admin_insert
on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists product_images_admin_update on storage.objects;
create policy product_images_admin_update
on storage.objects for update to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_delete
on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and public.is_admin());

-- -----------------------------------------------------------------------------
-- Security notes
-- -----------------------------------------------------------------------------
-- 1. The browser only uses the publishable/anon key. Never use service_role there.
-- 2. The service_role key is required only by the Edge Function that sends order email.
-- 3. The registration page does not expose a public "does this NIF/email exist?"
--    endpoint; uniqueness is enforced server-side by Auth/database constraints.
-- 4. Client accounts have a server-side unique NIF constraint; an administrator
--    cannot delete their own account through the application.
-- 5. A client cannot promote their own profile to admin because the trigger blocks
--    role changes unless the caller is already an administrator.
-- 6. Product availability is enforced again by create_order on the server.
--
-- To create the first administrator, register the account normally and then use
-- Supabase Table Editor on public.profiles to change only that account's role to
-- admin. Do not expose an admin role selector in the public registration form.
