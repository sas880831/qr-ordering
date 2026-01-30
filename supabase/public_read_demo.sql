-- ✅ 只用於 Demo：讓匿名使用者能讀菜單/桌號/店家（SELECT only）
-- 真正上線時建議改成 view + 更嚴格規則

alter table public.stores enable row level security;
alter table public.tables enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.option_groups enable row level security;
alter table public.options enable row level security;
alter table public.product_option_groups enable row level security;

drop policy if exists public_read_stores on public.stores;
drop policy if exists public_read_tables on public.tables;
drop policy if exists public_read_categories on public.categories;
drop policy if exists public_read_products on public.products;
drop policy if exists public_read_option_groups on public.option_groups;
drop policy if exists public_read_options on public.options;
drop policy if exists public_read_pog on public.product_option_groups;

create policy public_read_stores on public.stores for select using (true);
create policy public_read_tables on public.tables for select using (is_active = true);
create policy public_read_categories on public.categories for select using (true);
create policy public_read_products on public.products for select using (is_active = true);
create policy public_read_option_groups on public.option_groups for select using (true);
create policy public_read_options on public.options for select using (true);
create policy public_read_pog on public.product_option_groups for select using (true);
