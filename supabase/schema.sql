create extension if not exists "uuid-ossp";

create table if not exists public.stores (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null,
  name text not null,
  slug text not null unique,
  logo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.tables (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references public.stores(id) on delete cascade,
  table_code text not null,
  display_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(store_id, table_code)
);

create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  price int not null,
  image_url text,
  is_active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.option_groups (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  selection_type text not null default 'single',
  is_required boolean not null default false,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.options (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.option_groups(id) on delete cascade,
  name text not null,
  price_delta int not null default 0,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_option_groups (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  group_id uuid not null references public.option_groups(id) on delete cascade,
  unique(product_id, group_id)
);

create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references public.stores(id) on delete cascade,
  table_id uuid not null references public.tables(id),
  status text not null default 'new',
  note text,
  total int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  qty int not null,
  unit_price int not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.order_item_options (
  id uuid primary key default uuid_generate_v4(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  option_id uuid not null references public.options(id),
  price_delta int not null default 0
);

create index if not exists idx_products_store on public.products(store_id);
create index if not exists idx_orders_store_created on public.orders(store_id, created_at desc);
create index if not exists idx_tables_store on public.tables(store_id);
