-- CONSULDOCE B2B CATALOG
-- Run in Supabase SQL Editor. Never expose the service_role key to the browser.

create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('client','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('new','processing','completed','cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null default '',
  nif text not null default '',
  address text not null default '',
  role public.user_role not null default 'client',
  created_at timestamptz not null default now()
);

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
create index if not exists products_name_idx on public.products using gin (to_tsvector('simple', name));

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete restrict,
  status public.order_status not null default 'new',
  notes text,
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

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at before update on public.products for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,email,full_name,nif,address)
  values (new.id,new.email,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    coalesce(new.raw_user_meta_data->>'nif',''),
    coalesce(new.raw_user_meta_data->>'address',''))
  on conflict (id) do update set email=excluded.email;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin');
$$;

-- Client can edit only their own contact details; role is never client-writable.
alter table public.profiles enable row level security;
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (id=auth.uid() or public.is_admin());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated using (id=auth.uid() or public.is_admin()) with check (id=auth.uid() or public.is_admin());
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());

alter table public.products enable row level security;
drop policy if exists products_read on public.products;
create policy products_read on public.products for select to authenticated using (active=true or public.is_admin());
drop policy if exists products_admin_insert on public.products;
create policy products_admin_insert on public.products for insert to authenticated with check (public.is_admin());
drop policy if exists products_admin_update on public.products;
create policy products_admin_update on public.products for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists products_admin_delete on public.products;
create policy products_admin_delete on public.products for delete to authenticated using (public.is_admin());

alter table public.orders enable row level security;
drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders for select to authenticated using (client_id=auth.uid() or public.is_admin());
drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());

alter table public.order_items enable row level security;
drop policy if exists order_items_select on public.order_items;
create policy order_items_select on public.order_items for select to authenticated using (exists(select 1 from public.orders o where o.id=order_id and (o.client_id=auth.uid() or public.is_admin())));

-- Atomic order creation: validates product state. Availability is controlled by admin; physical stock is informational only.
create or replace function public.create_order(p_items jsonb, p_notes text default null)
returns uuid
language plpgsql security definer set search_path=public
as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_product_id uuid;
begin
  if auth.uid() is null then raise exception 'Não autenticado'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items)=0 then raise exception 'Carrinho vazio'; end if;
  if not exists(select 1 from public.profiles where id=auth.uid() and role in ('client','admin')) then raise exception 'Perfil inválido'; end if;

  insert into public.orders(client_id,notes) values(auth.uid(),nullif(left(coalesce(p_notes,''),1000),'')) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::integer;
    if v_qty is null or v_qty <= 0 then raise exception 'Quantidade inválida'; end if;
    select * into v_product from public.products where id=v_product_id and active=true for update;
    if not found then raise exception 'Produto indisponível'; end if;
    if not v_product.in_stock then
      raise exception 'Produto fora de stock: %', v_product.name;
    end if;
    insert into public.order_items(order_id,product_id,sku,product_name,quantity)
      values(v_order_id,v_product.id,v_product.sku,v_product.name,v_qty);
    -- stock_quantity is not decremented automatically: admin controls the catalogue availability flag.
  end loop;
  return v_order_id;
exception when others then
  raise;
end $$;
grant execute on function public.create_order(jsonb,text) to authenticated;

-- Storage: product images are public assets; only admins can upload/delete them.
insert into storage.buckets (id,name,public) values ('product-images','product-images',true)
on conflict (id) do update set public=true;
drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read on storage.objects for select using (bucket_id='product-images');
drop policy if exists product_images_admin_insert on storage.objects;
create policy product_images_admin_insert on storage.objects for insert to authenticated with check (bucket_id='product-images' and public.is_admin());
drop policy if exists product_images_admin_update on storage.objects;
create policy product_images_admin_update on storage.objects for update to authenticated using (bucket_id='product-images' and public.is_admin()) with check (bucket_id='product-images' and public.is_admin());
drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_delete on storage.objects for delete to authenticated using (bucket_id='product-images' and public.is_admin());

-- After creating your own account, promote it once from the SQL editor:
-- update public.profiles set role='admin' where email='SEU_EMAIL_ADMIN';
