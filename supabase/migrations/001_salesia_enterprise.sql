-- SalesIA Enterprise — esquema inicial para Supabase/PostgreSQL
-- Ejecutar una sola vez en Supabase > SQL Editor.
begin;
create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 120),
  tax_id text check (tax_id is null or tax_id ~ '^[0-9]{11}$'),
  business_email text,
  address text,
  currency char(3) not null default 'PEN',
  timezone text not null default 'America/Lima',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete restrict,
  full_name text not null default 'Usuario',
  email text not null default '',
  role_key text not null default 'pendiente' check (role_key in ('administrador','gerente','vendedor','analista','almacen','pendiente')),
  status text not null default 'activo' check (status in ('activo','inactivo')),
  must_change_password boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists profiles_org_idx on public.profiles(organization_id);

create table if not exists public.role_permissions (
  id bigint generated always as identity primary key,
  role_key text not null check (role_key in ('administrador','gerente','vendedor','analista','almacen')),
  module_key text not null,
  action_key text not null check (action_key in ('read','create','update','delete','export','manage_users','manage_roles','manage_settings')),
  unique(role_key,module_key,action_key)
);

insert into public.role_permissions(role_key,module_key,action_key)
select r.role_key,p.module_key,p.action_key
from (values ('administrador'),('gerente'),('vendedor'),('analista'),('almacen')) r(role_key)
cross join (values
 ('inicio','read'),('gestion_comercial','read'),('gestion_comercial','create'),('gestion_comercial','update'),('gestion_comercial','delete'),
 ('ventas_pedidos','read'),('ventas_pedidos','create'),('ventas_pedidos','update'),('ventas_pedidos','delete'),
 ('inventario','read'),('inventario','create'),('inventario','update'),('inventario','delete'),
 ('analitica_estadistica','read'),('analitica_estadistica','create'),('analitica_estadistica','export'),
 ('probabilidad_bayes','read'),('probabilidad_bayes','create'),
 ('insights','read'),('insights','create'),
 ('reportes','read'),('reportes','export'),
 ('administracion','read'),('administracion','manage_users'),('administracion','manage_roles'),('administracion','manage_settings')
) p(module_key,action_key)
where r.role_key='administrador'
on conflict do nothing;
insert into public.role_permissions(role_key,module_key,action_key) values
 ('gerente','inicio','read'),('gerente','gestion_comercial','read'),('gerente','gestion_comercial','create'),('gerente','gestion_comercial','update'),
 ('gerente','ventas_pedidos','read'),('gerente','ventas_pedidos','create'),('gerente','ventas_pedidos','update'),
 ('gerente','inventario','read'),('gerente','analitica_estadistica','read'),('gerente','analitica_estadistica','create'),('gerente','analitica_estadistica','export'),
 ('gerente','probabilidad_bayes','read'),('gerente','probabilidad_bayes','create'),('gerente','insights','read'),('gerente','reportes','read'),('gerente','reportes','export'),('gerente','administracion','read'),
 ('vendedor','inicio','read'),('vendedor','gestion_comercial','read'),('vendedor','gestion_comercial','create'),('vendedor','gestion_comercial','update'),('vendedor','ventas_pedidos','read'),('vendedor','ventas_pedidos','create'),('vendedor','ventas_pedidos','update'),('vendedor','inventario','read'),('vendedor','reportes','read'),
 ('analista','inicio','read'),('analista','gestion_comercial','read'),('analista','ventas_pedidos','read'),('analista','inventario','read'),('analista','analitica_estadistica','read'),('analista','analitica_estadistica','create'),('analista','analitica_estadistica','export'),('analista','probabilidad_bayes','read'),('analista','probabilidad_bayes','create'),('analista','insights','read'),('analista','insights','create'),('analista','reportes','read'),('analista','reportes','export'),
 ('almacen','inicio','read'),('almacen','gestion_comercial','read'),('almacen','inventario','read'),('almacen','inventario','create'),('almacen','inventario','update'),('almacen','reportes','read'),('almacen','reportes','export')
on conflict do nothing;

create or replace function public.current_organization_id()
returns uuid language sql stable security definer set search_path=public
as $$ select p.organization_id from public.profiles p where p.id=auth.uid() and p.status='activo' $$;

create or replace function public.current_role_key()
returns text language sql stable security definer set search_path=public
as $$ select p.role_key from public.profiles p where p.id=auth.uid() and p.status='activo' $$;

create or replace function public.has_permission(p_module text,p_action text)
returns boolean language sql stable security definer set search_path=public
as $$
 select exists (
   select 1 from public.profiles p
   join public.role_permissions rp on rp.role_key=p.role_key
   where p.id=auth.uid() and p.status='activo' and p.organization_id is not null
     and (p.role_key='administrador' or (rp.module_key=p_module and rp.action_key=p_action))
 )
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path=public
as $$ begin new.updated_at=now(); return new; end $$;

create table if not exists public.business_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  invoice_series text not null default 'F001',
  low_stock_threshold integer not null default 5 check (low_stock_threshold>=0),
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null, name text not null check(length(trim(name)) between 1 and 100), description text,
  is_active boolean not null default true, created_at timestamptz not null default now(),
  unique(organization_id,code), unique(organization_id,name)
);
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null, name text not null check(length(trim(name)) between 2 and 160), email text, phone text, address text,
  segment text not null default 'minorista' check(segment in ('corporativo','pyme','minorista')),
  status text not null default 'activo' check(status in ('activo','inactivo')), notes text,
  created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(organization_id,code)
);
create index if not exists customers_org_name_idx on public.customers(organization_id,name);
create table if not exists public.sellers (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null, code text not null, name text not null,
  email text, phone text, monthly_goal numeric(14,2) not null default 0 check(monthly_goal>=0),
  status text not null default 'activo' check(status in ('activo','inactivo')), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(organization_id,code)
);
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null, code text not null, name text not null,
  description text, unit text not null default 'unidad', price numeric(14,2) not null check(price>=0), cost numeric(14,2) not null default 0 check(cost>=0),
  stock_quantity integer not null default 0 check(stock_quantity>=0), minimum_stock integer not null default 0 check(minimum_stock>=0),
  status text not null default 'activo' check(status in ('activo','inactivo','agotado')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(organization_id,code)
);
create index if not exists products_org_name_idx on public.products(organization_id,name);
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null, sold_at timestamptz not null default now(), customer_id uuid references public.customers(id) on delete set null,
  seller_id uuid references public.sellers(id) on delete set null, status text not null default 'pendiente' check(status in ('pendiente','pagada','anulada')),
  subtotal numeric(14,2) not null default 0 check(subtotal>=0), discount numeric(14,2) not null default 0 check(discount>=0), tax numeric(14,2) not null default 0 check(tax>=0),
  total numeric(14,2) not null default 0 check(total>=0), notes text, created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,code)
);
create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(), sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict, quantity integer not null check(quantity>0),
  unit_price numeric(14,2) not null check(unit_price>=0), line_total numeric(14,2) generated always as (quantity*unit_price) stored
);
create index if not exists sales_org_date_idx on public.sales(organization_id,sold_at desc);
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null, order_date date not null default current_date, customer_id uuid references public.customers(id) on delete set null,
  seller_id uuid references public.sellers(id) on delete set null, status text not null default 'pendiente' check(status in ('pendiente','confirmado','preparando','completado','cancelado')),
  total numeric(14,2) not null default 0 check(total>=0), notes text, created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,code)
);
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict, quantity integer not null check(quantity>0), unit_price numeric(14,2) not null check(unit_price>=0)
);
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade, amount numeric(14,2) not null check(amount>0),
  method text not null check(method in ('efectivo','tarjeta','transferencia','yape','plin','otro')),
  status text not null default 'confirmado' check(status in ('pendiente','confirmado','rechazado','reembolsado')),
  reference text, paid_at timestamptz, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now()
);
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict, movement_type text not null check(movement_type in ('entrada','salida','ajuste')),
  quantity integer not null check(quantity>0), reason text not null, unit_cost numeric(14,2) check(unit_cost>=0), related_sale_id uuid references public.sales(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now()
);
create index if not exists inventory_org_date_idx on public.inventory_movements(organization_id,created_at desc);

create table if not exists public.datasets (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, description text, source text not null default 'ventas', columns_schema jsonb not null default '[]'::jsonb,
  row_count integer not null default 0 check(row_count>=0), created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.analytics_runs (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  analysis_type text not null, dataset_id uuid references public.datasets(id) on delete set null,
  parameters jsonb not null default '{}'::jsonb, result jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now()
);
create table if not exists public.probability_events (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, description text, probability numeric(8,7) not null check(probability between 0 and 1),
  event_group text, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now()
);
create table if not exists public.probability_runs (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  method text not null check(method in ('bayes','variable_aleatoria','probabilidad_compuesta','otro')),
  inputs jsonb not null default '{}'::jsonb, result jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now()
);
create table if not exists public.insights (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null, finding text not null, category text not null default 'comercial', severity text not null default 'informativo' check(severity in ('informativo','atencion','critico')),
  evidence jsonb not null default '{}'::jsonb, source_analysis_id uuid references public.analytics_runs(id) on delete set null,
  status text not null default 'nuevo' check(status in ('nuevo','revisado','descartado')), created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now()
);
create table if not exists public.report_exports (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  report_type text not null, file_name text not null, filters jsonb not null default '{}'::jsonb,
  format text not null default 'csv' check(format in ('csv','xlsx','json','pdf')), created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now()
);
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key, organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null, action text not null, entity_table text not null,
  entity_id text, details jsonb not null default '{}'::jsonb, ip_address inet, created_at timestamptz not null default now()
);
create index if not exists audit_org_date_idx on public.audit_logs(organization_id,created_at desc);

-- Los perfiles se crean automáticamente desde Supabase Auth, sin exponer contraseñas.
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path=public
as $$ begin
 insert into public.profiles(id,full_name,email,role_key,status,must_change_password)
 values(new.id,coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),'Usuario'),coalesce(new.email,''),'pendiente','activo',false)
 on conflict(id) do nothing;
 return new;
end $$;
drop trigger if exists on_auth_user_created_salesia on auth.users;
create trigger on_auth_user_created_salesia after insert on auth.users for each row execute function public.handle_new_auth_user();

-- Solo permite inicializar una empresa una vez desde la primera cuenta creada manualmente en Auth.
create or replace function public.bootstrap_first_admin(p_company_name text,p_full_name text,p_tax_id text default null,p_email text default null,p_address text default null)
returns uuid language plpgsql security definer set search_path=public
as $$
declare v_uid uuid:=auth.uid(); v_org uuid;
begin
 if v_uid is null then raise exception 'Debes iniciar sesión.'; end if;
 perform pg_advisory_xact_lock(hashtext('salesia-enterprise-bootstrap')::bigint);
 if exists(select 1 from public.organizations) then raise exception 'La configuración inicial ya fue realizada.'; end if;
 if not exists(select 1 from public.profiles where id=v_uid) then raise exception 'No existe un perfil para esta cuenta. Contacta al administrador del proyecto.'; end if;
 if exists(select 1 from public.profiles where id=v_uid and organization_id is not null) then raise exception 'Este usuario ya pertenece a una empresa.'; end if;
 if length(trim(coalesce(p_company_name,'')))<2 or length(trim(coalesce(p_full_name,'')))<2 then raise exception 'Completa la empresa y el nombre del administrador.'; end if;
 if p_tax_id is not null and p_tax_id<>'' and p_tax_id !~ '^[0-9]{11}$' then raise exception 'El RUC debe tener 11 dígitos.'; end if;
 insert into public.organizations(name,tax_id,business_email,address) values(trim(p_company_name),nullif(p_tax_id,''),nullif(trim(p_email),''),nullif(trim(p_address),'')) returning id into v_org;
 update public.profiles set organization_id=v_org,full_name=trim(p_full_name),email=coalesce((select email from auth.users where id=v_uid),''),role_key='administrador',status='activo',must_change_password=false,updated_at=now() where id=v_uid;
 insert into public.business_settings(organization_id) values(v_org) on conflict do nothing;
 insert into public.audit_logs(organization_id,actor_id,action,entity_table,details) values(v_org,v_uid,'configuracion_inicial','organizations',jsonb_build_object('name',trim(p_company_name)));
 return v_org;
end $$;

-- Rechaza referencias entre empresas incluso si alguien conoce un UUID ajeno.
create or replace function public.validate_tenant_relations()
returns trigger language plpgsql security definer set search_path=public
as $$
declare v_parent_org uuid; v_related_org uuid;
begin
 if tg_table_name='products' then
  if new.category_id is not null then
   select organization_id into v_related_org from public.categories where id=new.category_id;
   if v_related_org is distinct from new.organization_id then raise exception 'La categoría no pertenece a esta empresa.'; end if;
  end if;
 elsif tg_table_name='sellers' then
  if new.profile_id is not null then
   select organization_id into v_related_org from public.profiles where id=new.profile_id;
   if v_related_org is distinct from new.organization_id then raise exception 'El perfil no pertenece a esta empresa.'; end if;
  end if;
 elsif tg_table_name='sales' or tg_table_name='orders' then
  if new.customer_id is not null then
   select organization_id into v_related_org from public.customers where id=new.customer_id;
   if v_related_org is distinct from new.organization_id then raise exception 'El cliente no pertenece a esta empresa.'; end if;
  end if;
  if new.seller_id is not null then
   select organization_id into v_related_org from public.sellers where id=new.seller_id;
   if v_related_org is distinct from new.organization_id then raise exception 'El vendedor no pertenece a esta empresa.'; end if;
  end if;
 elsif tg_table_name='payments' then
  select organization_id into v_related_org from public.sales where id=new.sale_id;
  if v_related_org is distinct from new.organization_id then raise exception 'La venta no pertenece a esta empresa.'; end if;
 elsif tg_table_name='inventory_movements' then
  select organization_id into v_related_org from public.products where id=new.product_id;
  if v_related_org is distinct from new.organization_id then raise exception 'El producto no pertenece a esta empresa.'; end if;
  if new.related_sale_id is not null then
   select organization_id into v_related_org from public.sales where id=new.related_sale_id;
   if v_related_org is distinct from new.organization_id then raise exception 'La venta relacionada no pertenece a esta empresa.'; end if;
  end if;
 elsif tg_table_name='sale_items' then
  select organization_id into v_parent_org from public.sales where id=new.sale_id;
  select organization_id into v_related_org from public.products where id=new.product_id;
  if v_parent_org is null or v_related_org is distinct from v_parent_org then raise exception 'La venta y el producto deben pertenecer a la misma empresa.'; end if;
 elsif tg_table_name='order_items' then
  select organization_id into v_parent_org from public.orders where id=new.order_id;
  select organization_id into v_related_org from public.products where id=new.product_id;
  if v_parent_org is null or v_related_org is distinct from v_parent_org then raise exception 'El pedido y el producto deben pertenecer a la misma empresa.'; end if;
 end if;
 return new;
end $$;

drop trigger if exists products_validate_tenant on public.products;
create trigger products_validate_tenant before insert or update of organization_id,category_id on public.products for each row execute function public.validate_tenant_relations();
drop trigger if exists sellers_validate_tenant on public.sellers;
create trigger sellers_validate_tenant before insert or update of organization_id,profile_id on public.sellers for each row execute function public.validate_tenant_relations();
drop trigger if exists sales_validate_tenant on public.sales;
create trigger sales_validate_tenant before insert or update of organization_id,customer_id,seller_id on public.sales for each row execute function public.validate_tenant_relations();
drop trigger if exists orders_validate_tenant on public.orders;
create trigger orders_validate_tenant before insert or update of organization_id,customer_id,seller_id on public.orders for each row execute function public.validate_tenant_relations();
drop trigger if exists payments_validate_tenant on public.payments;
create trigger payments_validate_tenant before insert or update of organization_id,sale_id on public.payments for each row execute function public.validate_tenant_relations();
drop trigger if exists inventory_validate_tenant on public.inventory_movements;
create trigger inventory_validate_tenant before insert or update of organization_id,product_id,related_sale_id on public.inventory_movements for each row execute function public.validate_tenant_relations();
drop trigger if exists sale_items_validate_tenant on public.sale_items;
create trigger sale_items_validate_tenant before insert or update of sale_id,product_id on public.sale_items for each row execute function public.validate_tenant_relations();
drop trigger if exists order_items_validate_tenant on public.order_items;
create trigger order_items_validate_tenant before insert or update of order_id,product_id on public.order_items for each row execute function public.validate_tenant_relations();

-- El stock solo cambia mediante un movimiento registrado, evitando saldos sin trazabilidad.
create or replace function public.guard_direct_stock_change()
returns trigger language plpgsql set search_path=public
as $$
begin
 if tg_op='INSERT' and coalesce(new.stock_quantity,0)<>0 then
  raise exception 'Crea el producto con stock cero y registra el saldo inicial como un movimiento de entrada.';
 end if;
 if tg_op='UPDATE' and new.stock_quantity is distinct from old.stock_quantity and coalesce(current_setting('salesia.allow_stock_update',true),'off')<>'on' then
  raise exception 'No se puede cambiar el stock directamente. Registra un movimiento de inventario.';
 end if;
 return new;
end $$;
drop trigger if exists products_guard_stock_insert on public.products;
create trigger products_guard_stock_insert before insert on public.products for each row execute function public.guard_direct_stock_change();
drop trigger if exists products_guard_stock_update on public.products;
create trigger products_guard_stock_update before update of stock_quantity on public.products for each row execute function public.guard_direct_stock_change();

create or replace function public.apply_inventory_movement()
returns trigger language plpgsql security definer set search_path=public
as $$
declare v_stock integer; v_new_stock integer; v_status text;
begin
 select stock_quantity,status into v_stock,v_status from public.products where id=new.product_id and organization_id=new.organization_id for update;
 if not found then raise exception 'El producto no pertenece a la empresa activa.'; end if;
 if new.movement_type='entrada' then v_new_stock:=v_stock+new.quantity;
 elsif new.movement_type='salida' then
  if v_stock<new.quantity then raise exception 'Stock insuficiente: disponible %, solicitado %.',v_stock,new.quantity; end if;
  v_new_stock:=v_stock-new.quantity;
 else v_new_stock:=new.quantity;
 end if;
 new.created_by:=coalesce(new.created_by,auth.uid());
 perform set_config('salesia.allow_stock_update','on',true);
 update public.products set stock_quantity=v_new_stock,
   status=case when v_new_stock=0 and status<>'inactivo' then 'agotado' when v_new_stock>0 and status='agotado' then 'activo' else status end,
   updated_at=now()
 where id=new.product_id and organization_id=new.organization_id;
 perform set_config('salesia.allow_stock_update','off',true);
 return new;
end $$;
drop trigger if exists inventory_apply_stock on public.inventory_movements;
create trigger inventory_apply_stock before insert on public.inventory_movements for each row execute function public.apply_inventory_movement();

create or replace function public.consume_stock_for_sale_item()
returns trigger language plpgsql security definer set search_path=public
as $$
declare v_org uuid; v_sale_code text; v_sale_status text;
begin
 select organization_id,code,status into v_org,v_sale_code,v_sale_status from public.sales where id=new.sale_id;
 if v_sale_status is distinct from 'anulada' then
  insert into public.inventory_movements(organization_id,product_id,movement_type,quantity,reason,related_sale_id,created_by)
  values(v_org,new.product_id,'salida',new.quantity,'Venta '||v_sale_code,new.sale_id,auth.uid());
 end if;
 return new;
end $$;
drop trigger if exists sale_item_consume_stock on public.sale_items;
create trigger sale_item_consume_stock after insert on public.sale_items for each row execute function public.consume_stock_for_sale_item();

create or replace function public.restore_stock_on_sale_cancel()
returns trigger language plpgsql security definer set search_path=public
as $$
declare v_item record;
begin
 if old.status<>'anulada' and new.status='anulada' then
  for v_item in select si.product_id,si.quantity from public.sale_items si where si.sale_id=new.id loop
   insert into public.inventory_movements(organization_id,product_id,movement_type,quantity,reason,related_sale_id,created_by)
   values(new.organization_id,v_item.product_id,'entrada',v_item.quantity,'Reversión de venta anulada '||new.code,new.id,auth.uid());
  end loop;
 end if;
 return new;
end $$;
drop trigger if exists sales_restore_stock on public.sales;
create trigger sales_restore_stock after update of status on public.sales for each row execute function public.restore_stock_on_sale_cancel();

create or replace function public.register_inventory_movement(p_product_id uuid,p_type text,p_quantity integer,p_reason text,p_unit_cost numeric default null)
returns uuid language plpgsql security definer set search_path=public
as $$
declare v_org uuid:=public.current_organization_id(); v_id uuid;
begin
 if auth.uid() is null or v_org is null or not public.has_permission('inventario','create') then raise exception 'No tienes permiso para registrar movimientos de inventario.'; end if;
 if p_type not in ('entrada','salida','ajuste') then raise exception 'Tipo de movimiento no válido.'; end if;
 if p_quantity is null or p_quantity<=0 then raise exception 'La cantidad debe ser un entero positivo.'; end if;
 if length(trim(coalesce(p_reason,'')))<3 then raise exception 'Escribe un motivo de al menos 3 caracteres.'; end if;
 if p_unit_cost is not null and p_unit_cost<0 then raise exception 'El costo unitario no puede ser negativo.'; end if;
 insert into public.inventory_movements(organization_id,product_id,movement_type,quantity,reason,unit_cost,created_by)
 values(v_org,p_product_id,p_type,p_quantity,trim(p_reason),p_unit_cost,auth.uid()) returning id into v_id;
 return v_id;
end $$;

-- Alta de una venta: calcula importes desde los precios del catálogo y descuenta stock en una transacción.
create or replace function public.register_sale(p_customer_id uuid,p_seller_id uuid,p_items jsonb,p_payment_method text default null,p_status text default 'pendiente',p_notes text default null)
returns uuid language plpgsql security definer set search_path=public
as $$
declare v_org uuid:=public.current_organization_id(); v_sale_id uuid; v_code text; v_total numeric(14,2):=0; v_item record; v_product record;
begin
 if auth.uid() is null or v_org is null then raise exception 'Debes iniciar sesión en una empresa activa.'; end if;
 if not public.has_permission('ventas_pedidos','create') then raise exception 'No tienes permiso para registrar ventas.'; end if;
 if p_status not in ('pendiente','pagada') then raise exception 'Estado de venta no permitido.'; end if;
 if p_status='pagada' and p_payment_method not in ('efectivo','tarjeta','transferencia','yape','plin','otro') then raise exception 'Método de pago no válido.'; end if;
 if p_items is null or jsonb_typeof(p_items) is distinct from 'array' then raise exception 'La venta debe contener una lista de productos válida.'; end if;
 if jsonb_array_length(p_items)<1 or jsonb_array_length(p_items)>100 then raise exception 'La venta debe contener entre 1 y 100 líneas.'; end if;
 if not exists(select 1 from public.customers where id=p_customer_id and organization_id=v_org and status='activo') then raise exception 'Selecciona un cliente activo de esta empresa.'; end if;
 if not exists(select 1 from public.sellers where id=p_seller_id and organization_id=v_org and status='activo') then raise exception 'Selecciona un vendedor activo de esta empresa.'; end if;
 for v_item in select x.product_id,sum(x.quantity)::integer as quantity from jsonb_to_recordset(p_items) as x(product_id uuid,quantity integer) group by x.product_id order by x.product_id loop
  if v_item.product_id is null or v_item.quantity is null or v_item.quantity<=0 then raise exception 'Producto o cantidad inválidos.'; end if;
  select id,price,stock_quantity,status into v_product from public.products where id=v_item.product_id and organization_id=v_org for update;
  if not found then raise exception 'Un producto no pertenece a esta empresa.'; end if;
  if v_product.status<>'activo' then raise exception 'El producto seleccionado está inactivo.'; end if;
  if v_product.stock_quantity<v_item.quantity then raise exception 'Stock insuficiente para el producto %: disponible %, solicitado %.',v_item.product_id,v_product.stock_quantity,v_item.quantity; end if;
  v_total:=v_total+v_product.price*v_item.quantity;
 end loop;
 v_code:='VTA-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
 insert into public.sales(organization_id,code,customer_id,seller_id,status,subtotal,total,notes,created_by)
 values(v_org,v_code,p_customer_id,p_seller_id,p_status,v_total,v_total,nullif(trim(p_notes),''),auth.uid()) returning id into v_sale_id;
 for v_item in select x.product_id,x.quantity from jsonb_to_recordset(p_items) as x(product_id uuid,quantity integer) loop
  select price into v_product from public.products where id=v_item.product_id and organization_id=v_org;
  insert into public.sale_items(sale_id,product_id,quantity,unit_price) values(v_sale_id,v_item.product_id,v_item.quantity,v_product.price);
 end loop;
 if p_status='pagada' then
  insert into public.payments(organization_id,sale_id,amount,method,status,paid_at,created_by)
  values(v_org,v_sale_id,v_total,p_payment_method,'confirmado',now(),auth.uid());
 end if;
 return v_sale_id;
end $$;

create or replace function public.register_sale_payment(p_sale_id uuid,p_method text,p_reference text default null)
returns uuid language plpgsql security definer set search_path=public
as $$
declare v_org uuid:=public.current_organization_id(); v_sale public.sales%rowtype; v_payment uuid; v_paid numeric(14,2);
begin
 if auth.uid() is null or not public.has_permission('ventas_pedidos','update') then raise exception 'No tienes permiso para registrar pagos.'; end if;
 select * into v_sale from public.sales where id=p_sale_id and organization_id=v_org for update;
 if not found then raise exception 'La venta no existe en esta empresa.'; end if;
 if v_sale.status<>'pendiente' then raise exception 'La venta no está pendiente de pago.'; end if;
 if p_method not in ('efectivo','tarjeta','transferencia','yape','plin','otro') then raise exception 'Método de pago no válido.'; end if;
 select coalesce(sum(amount),0) into v_paid from public.payments where sale_id=p_sale_id and status='confirmado';
 if v_paid>=v_sale.total then raise exception 'La venta ya está pagada.'; end if;
 insert into public.payments(organization_id,sale_id,amount,method,status,reference,paid_at,created_by)
 values(v_org,p_sale_id,v_sale.total-v_paid,p_method,'confirmado',nullif(trim(p_reference),''),now(),auth.uid()) returning id into v_payment;
 update public.sales set status='pagada',updated_at=now() where id=p_sale_id;
 return v_payment;
end $$;

create or replace function public.cancel_sale(p_sale_id uuid,p_reason text)
returns void language plpgsql security definer set search_path=public
as $$
declare v_org uuid:=public.current_organization_id();
begin
 if auth.uid() is null or not public.has_permission('ventas_pedidos','update') then raise exception 'No tienes permiso para anular ventas.'; end if;
 if length(trim(coalesce(p_reason,'')))<3 then raise exception 'Indica el motivo de anulación.'; end if;
 update public.sales set status='anulada',notes=concat_ws(E'\n',notes,'Anulación: '||trim(p_reason)),updated_at=now()
 where id=p_sale_id and organization_id=v_org and status='pendiente';
 if not found then raise exception 'La venta no existe, ya está cerrada o requiere gestionar primero una devolución del pago.'; end if;
end $$;

-- Pedidos: registran cantidades y precio actual; no apartan stock hasta convertirse en venta.
create or replace function public.register_order(p_customer_id uuid,p_seller_id uuid,p_items jsonb,p_notes text default null)
returns uuid language plpgsql security definer set search_path=public
as $$
declare v_org uuid:=public.current_organization_id(); v_order_id uuid; v_code text; v_total numeric(14,2):=0; v_item record; v_product record;
begin
 if auth.uid() is null or v_org is null or not public.has_permission('ventas_pedidos','create') then raise exception 'No tienes permiso para registrar pedidos.'; end if;
 if p_items is null or jsonb_typeof(p_items) is distinct from 'array' then raise exception 'El pedido debe contener una lista de productos válida.'; end if;
 if jsonb_array_length(p_items)<1 or jsonb_array_length(p_items)>100 then raise exception 'El pedido debe contener entre 1 y 100 líneas.'; end if;
 if not exists(select 1 from public.customers where id=p_customer_id and organization_id=v_org and status='activo') then raise exception 'Selecciona un cliente activo.'; end if;
 if not exists(select 1 from public.sellers where id=p_seller_id and organization_id=v_org and status='activo') then raise exception 'Selecciona un vendedor activo.'; end if;
 for v_item in select x.product_id,sum(x.quantity)::integer as quantity from jsonb_to_recordset(p_items) as x(product_id uuid,quantity integer) group by x.product_id order by x.product_id loop
  if v_item.product_id is null or v_item.quantity is null or v_item.quantity<=0 then raise exception 'Producto o cantidad inválidos.'; end if;
  select id,price,status into v_product from public.products where id=v_item.product_id and organization_id=v_org;
  if not found or v_product.status<>'activo' then raise exception 'Uno de los productos no está disponible.'; end if;
  v_total:=v_total+v_product.price*v_item.quantity;
 end loop;
 v_code:='PED-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
 insert into public.orders(organization_id,code,customer_id,seller_id,status,total,notes,created_by)
 values(v_org,v_code,p_customer_id,p_seller_id,'pendiente',v_total,nullif(trim(p_notes),''),auth.uid()) returning id into v_order_id;
 for v_item in select x.product_id,x.quantity from jsonb_to_recordset(p_items) as x(product_id uuid,quantity integer) loop
  select price into v_product from public.products where id=v_item.product_id and organization_id=v_org;
  insert into public.order_items(order_id,product_id,quantity,unit_price) values(v_order_id,v_item.product_id,v_item.quantity,v_product.price);
 end loop;
 return v_order_id;
end $$;

create or replace function public.update_order_status(p_order_id uuid,p_status text,p_notes text default null)
returns void language plpgsql security definer set search_path=public
as $$
declare v_org uuid:=public.current_organization_id();
begin
 if auth.uid() is null or not public.has_permission('ventas_pedidos','update') then raise exception 'No tienes permiso para actualizar pedidos.'; end if;
 if p_status not in ('confirmado','preparando','cancelado') then raise exception 'Usa registrar la venta para completar un pedido.'; end if;
 update public.orders set status=p_status,notes=case when nullif(trim(p_notes),'') is null then notes else concat_ws(E'\n',notes,trim(p_notes)) end,updated_at=now()
 where id=p_order_id and organization_id=v_org and status not in ('completado','cancelado');
 if not found then raise exception 'El pedido no existe o ya está cerrado.'; end if;
end $$;

create or replace function public.convert_order_to_sale(p_order_id uuid,p_payment_method text default null)
returns uuid language plpgsql security definer set search_path=public
as $$
declare v_org uuid:=public.current_organization_id(); v_order public.orders%rowtype; v_items jsonb; v_sale_id uuid;
begin
 if auth.uid() is null or not public.has_permission('ventas_pedidos','create') then raise exception 'No tienes permiso para convertir pedidos.'; end if;
 select * into v_order from public.orders where id=p_order_id and organization_id=v_org for update;
 if not found or v_order.status in ('completado','cancelado') then raise exception 'El pedido no existe o ya está cerrado.'; end if;
 select jsonb_agg(jsonb_build_object('product_id',product_id,'quantity',quantity)) into v_items from public.order_items where order_id=p_order_id;
 v_sale_id:=public.register_sale(v_order.customer_id,v_order.seller_id,v_items,p_payment_method,case when p_payment_method is null then 'pendiente' else 'pagada' end,'Convertido desde pedido '||v_order.code);
 update public.orders set status='completado',updated_at=now() where id=p_order_id;
 return v_sale_id;
end $$;

-- RLS helpers avoid recursive policies on profiles.
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.role_permissions enable row level security;

drop policy if exists org_select_member on public.organizations;
create policy org_select_member on public.organizations for select to authenticated using(id=public.current_organization_id());
drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin on public.profiles for select to authenticated using(id=auth.uid() or (organization_id=public.current_organization_id() and public.has_permission('administracion','manage_users')));
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles for update to authenticated using(organization_id=public.current_organization_id() and public.has_permission('administracion','manage_users')) with check(organization_id=public.current_organization_id() and public.has_permission('administracion','manage_users'));
drop policy if exists role_permissions_read_member on public.role_permissions;
create policy role_permissions_read_member on public.role_permissions for select to authenticated using(public.current_role_key()='administrador' or role_key=public.current_role_key());

alter table public.audit_logs enable row level security;
drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs for select to authenticated using(organization_id=public.current_organization_id() and public.has_permission('administracion','manage_users'));

-- Organization-scoped data access by role/module permission.
do $$
declare t text; m text;
begin
 for t,m in select * from (values
 ('business_settings','administracion'),('categories','gestion_comercial'),('customers','gestion_comercial'),('sellers','gestion_comercial'),('products','gestion_comercial'),
 ('sales','ventas_pedidos'),('orders','ventas_pedidos'),('payments','ventas_pedidos'),('inventory_movements','inventario'),
 ('datasets','analitica_estadistica'),('analytics_runs','analitica_estadistica'),('probability_events','probabilidad_bayes'),('probability_runs','probabilidad_bayes'),
 ('insights','insights'),('report_exports','reportes')
 ) as x(tablename,module_key)
 loop
   execute format('alter table public.%I enable row level security',t);
   execute format('drop policy if exists %I on public.%I',t||'_select',t);
   execute format('create policy %I on public.%I for select to authenticated using (organization_id=public.current_organization_id() and public.has_permission(%L,%L))',t||'_select',t,m,'read');
   execute format('drop policy if exists %I on public.%I',t||'_insert',t);
   execute format('create policy %I on public.%I for insert to authenticated with check (organization_id=public.current_organization_id() and public.has_permission(%L,%L))',t||'_insert',t,m,'create');
   execute format('drop policy if exists %I on public.%I',t||'_update',t);
   execute format('create policy %I on public.%I for update to authenticated using (organization_id=public.current_organization_id() and public.has_permission(%L,%L)) with check (organization_id=public.current_organization_id() and public.has_permission(%L,%L))',t||'_update',t,m,'update',m,'update');
   execute format('drop policy if exists %I on public.%I',t||'_delete',t);
   execute format('create policy %I on public.%I for delete to authenticated using (organization_id=public.current_organization_id() and public.has_permission(%L,%L))',t||'_delete',t,m,'delete');
 end loop;
end $$;

-- sale_items y order_items no tienen organization_id; la organización se valida a través del encabezado.
alter table public.sale_items enable row level security;
alter table public.order_items enable row level security;
drop policy if exists sale_items_select on public.sale_items;
drop policy if exists sale_items_insert on public.sale_items;
drop policy if exists sale_items_update on public.sale_items;
drop policy if exists sale_items_delete on public.sale_items;
create policy sale_items_select on public.sale_items for select to authenticated using (exists(select 1 from public.sales s where s.id=sale_id and s.organization_id=public.current_organization_id() and public.has_permission('ventas_pedidos','read')));
create policy sale_items_insert on public.sale_items for insert to authenticated with check (exists(select 1 from public.sales s where s.id=sale_id and s.organization_id=public.current_organization_id() and public.has_permission('ventas_pedidos','create')));
create policy sale_items_update on public.sale_items for update to authenticated using (exists(select 1 from public.sales s where s.id=sale_id and s.organization_id=public.current_organization_id() and public.has_permission('ventas_pedidos','update'))) with check (exists(select 1 from public.sales s where s.id=sale_id and s.organization_id=public.current_organization_id() and public.has_permission('ventas_pedidos','update')));
create policy sale_items_delete on public.sale_items for delete to authenticated using (exists(select 1 from public.sales s where s.id=sale_id and s.organization_id=public.current_organization_id() and public.has_permission('ventas_pedidos','delete')));
drop policy if exists order_items_select on public.order_items;
drop policy if exists order_items_insert on public.order_items;
drop policy if exists order_items_update on public.order_items;
drop policy if exists order_items_delete on public.order_items;
create policy order_items_select on public.order_items for select to authenticated using (exists(select 1 from public.orders o where o.id=order_id and o.organization_id=public.current_organization_id() and public.has_permission('ventas_pedidos','read')));
create policy order_items_insert on public.order_items for insert to authenticated with check (exists(select 1 from public.orders o where o.id=order_id and o.organization_id=public.current_organization_id() and public.has_permission('ventas_pedidos','create')));
create policy order_items_update on public.order_items for update to authenticated using (exists(select 1 from public.orders o where o.id=order_id and o.organization_id=public.current_organization_id() and public.has_permission('ventas_pedidos','update'))) with check (exists(select 1 from public.orders o where o.id=order_id and o.organization_id=public.current_organization_id() and public.has_permission('ventas_pedidos','update')));
create policy order_items_delete on public.order_items for delete to authenticated using (exists(select 1 from public.orders o where o.id=order_id and o.organization_id=public.current_organization_id() and public.has_permission('ventas_pedidos','delete')));

-- Datos auxiliares y vistas de módulos
create or replace view public.v_sales_summary with (security_invoker=true) as
select s.organization_id,date_trunc('month',s.sold_at)::date as month,s.status,count(*) as sales_count,
 coalesce(sum(s.total),0)::numeric(14,2) as total_amount,coalesce(avg(s.total),0)::numeric(14,2) as average_ticket
from public.sales s group by s.organization_id,date_trunc('month',s.sold_at)::date,s.status;

-- Triggers de auditoría sobre cambios críticos. La tabla de auditoría no admite edición desde la app.
create or replace function public.audit_row_change()
returns trigger language plpgsql security definer set search_path=public
as $$
declare v_org uuid; v_id text; v_action text; v_details jsonb; v_actor uuid;
begin
 v_actor:=auth.uid();
 if tg_op='DELETE' and tg_table_name='profiles' then
  if v_actor=old.id then v_actor:=null; end if;
 end if;
 if tg_op='DELETE' then v_org:=old.organization_id; v_id:=coalesce(to_jsonb(old)->>'id',to_jsonb(old)->>'code'); v_action:='delete'; v_details:=case when tg_table_name='profiles' then '{}'::jsonb else jsonb_build_object('before',to_jsonb(old)-array['email','phone','address','business_email','notes','ip_address']::text[]) end;
 elsif tg_op='UPDATE' then v_org:=new.organization_id; v_id:=coalesce(to_jsonb(new)->>'id',to_jsonb(new)->>'code'); v_action:='update'; v_details:=case when tg_table_name='profiles' then jsonb_build_object('role_before',old.role_key,'role_after',new.role_key,'status_before',old.status,'status_after',new.status) else jsonb_build_object('before',to_jsonb(old)-array['email','phone','address','business_email','notes','ip_address']::text[],'after',to_jsonb(new)-array['email','phone','address','business_email','notes','ip_address']::text[]) end;
 else v_org:=new.organization_id; v_id:=coalesce(to_jsonb(new)->>'id',to_jsonb(new)->>'code'); v_action:='insert'; v_details:=case when tg_table_name='profiles' then jsonb_build_object('role',new.role_key,'status',new.status) else jsonb_build_object('after',to_jsonb(new)-array['email','phone','address','business_email','notes','ip_address']::text[]) end; end if;
 if v_org is not null then
  insert into public.audit_logs(organization_id,actor_id,action,entity_table,entity_id,details)
  values(v_org,v_actor,v_action,tg_table_name,v_id,v_details);
 end if;
 if tg_op='DELETE' then return old; else return new; end if;
end $$;
-- Updated timestamps are maintained by PostgreSQL, not the browser.
do $$ declare t text; begin
 foreach t in array array['organizations','profiles','categories','customers','sellers','products','sales','orders','datasets','business_settings'] loop
  execute format('drop trigger if exists touch_updated_at on public.%I',t);
  execute format('create trigger touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()',t);
 end loop;
end $$;

-- Audit is intentionally limited to core entities; credentials are never included.
do $$ declare t text; begin
 foreach t in array array['customers','products','sales','orders','payments','inventory_movements','profiles','business_settings'] loop
  execute format('drop trigger if exists audit_change on public.%I',t);
  execute format('create trigger audit_change after insert or update or delete on public.%I for each row execute function public.audit_row_change()',t);
 end loop;
end $$;

create or replace function public.finish_initial_password_change()
returns void language plpgsql security definer set search_path=public
as $$ begin
 if auth.uid() is null then raise exception 'Debes iniciar sesión.'; end if;
 update public.profiles set must_change_password=false,updated_at=now() where id=auth.uid() and status='activo';
 if not found then raise exception 'No se pudo actualizar el perfil.'; end if;
end $$;
revoke all on function public.finish_initial_password_change() from public;
grant execute on function public.finish_initial_password_change() to authenticated;

-- Privilegios mínimos: por defecto nadie puede escribir en organizaciones, perfiles,
-- matriz de roles ni auditoría desde el navegador. Las operaciones permitidas se
-- conceden tabla por tabla; RLS decide el alcance de las filas.
revoke all on table public.organizations,public.profiles,public.role_permissions,public.business_settings,
 public.categories,public.customers,public.sellers,public.products,public.sales,public.sale_items,
 public.orders,public.order_items,public.payments,public.inventory_movements,public.datasets,
 public.analytics_runs,public.probability_events,public.probability_runs,public.insights,
 public.report_exports,public.audit_logs,public.v_sales_summary from anon,authenticated;
grant select on public.organizations,public.profiles,public.role_permissions,public.v_sales_summary to authenticated;
grant select,insert,update,delete on public.business_settings,public.categories,public.customers,public.sellers,public.products,public.datasets,public.analytics_runs,public.probability_events,public.probability_runs,public.insights,public.report_exports to authenticated;
grant select on public.sales,public.sale_items,public.orders,public.order_items,public.payments,public.inventory_movements,public.audit_logs to authenticated;
revoke all on function public.register_inventory_movement(uuid,text,integer,text,numeric) from public;
revoke all on function public.register_sale(uuid,uuid,jsonb,text,text,text) from public;
revoke all on function public.register_sale_payment(uuid,text,text) from public;
revoke all on function public.cancel_sale(uuid,text) from public;
revoke all on function public.register_order(uuid,uuid,jsonb,text) from public;
revoke all on function public.update_order_status(uuid,text,text) from public;
revoke all on function public.convert_order_to_sale(uuid,text) from public;
grant execute on function public.register_inventory_movement(uuid,text,integer,text,numeric) to authenticated;
grant execute on function public.register_sale(uuid,uuid,jsonb,text,text,text) to authenticated;
grant execute on function public.register_sale_payment(uuid,text,text) to authenticated;
grant execute on function public.cancel_sale(uuid,text) to authenticated;
grant execute on function public.register_order(uuid,uuid,jsonb,text) to authenticated;
grant execute on function public.update_order_status(uuid,text,text) to authenticated;
grant execute on function public.convert_order_to_sale(uuid,text) to authenticated;

revoke all on function public.touch_updated_at() from public;
revoke all on function public.guard_direct_stock_change() from public;
revoke all on function public.apply_inventory_movement() from public;
revoke all on function public.consume_stock_for_sale_item() from public;
revoke all on function public.restore_stock_on_sale_cancel() from public;
revoke all on function public.validate_tenant_relations() from public;
revoke all on function public.audit_row_change() from public;
revoke all on function public.bootstrap_first_admin(text,text,text,text,text) from public;
grant execute on function public.bootstrap_first_admin(text,text,text,text,text) to authenticated;
revoke all on function public.current_organization_id() from public;
revoke all on function public.current_role_key() from public;
revoke all on function public.has_permission(text,text) from public;
grant execute on function public.current_organization_id() to authenticated;
grant execute on function public.current_role_key() to authenticated;
grant execute on function public.has_permission(text,text) to authenticated;
commit;
