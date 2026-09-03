-- CONSULDOCE: admin-controlled catalogue stock status
-- Run once in Supabase SQL Editor.
alter table public.products add column if not exists in_stock boolean not null default false;
alter table public.products add column if not exists catalog_price numeric;

-- Preserve the previous behaviour for existing records: products with physical stock
-- (or products that were not physically tracked) start as available.
update public.products
set in_stock = case when track_stock = false then true else stock_quantity > 0 end
where in_stock = false;

-- Availability is independent from the imported physical stock.
create index if not exists products_in_stock_idx on public.products(active, in_stock, category);

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
    if not v_product.in_stock then raise exception 'Produto fora de stock: %', v_product.name; end if;
    insert into public.order_items(order_id,product_id,sku,product_name,quantity)
      values(v_order_id,v_product.id,v_product.sku,v_product.name,v_qty);
  end loop;
  return v_order_id;
exception when others then
  raise;
end $$;
grant execute on function public.create_order(jsonb,text) to authenticated;
