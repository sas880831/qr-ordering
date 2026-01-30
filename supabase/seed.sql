-- ✅ 這份 seed.sql 會建立一間示範店（lin-snack）+ 30 桌 + 範例菜單 + 加料/辣度
-- 你只要把 owner_id 換成「你在 Supabase Auth 建的 user UUID」即可讓後台廚房頁能登入看到訂單。

do $$
declare
  v_owner uuid := '00000000-0000-0000-0000-000000000000'; -- <-- 改成你的 Auth user id
  v_store uuid;
  v_cat_main uuid;
  v_cat_soup uuid;
  v_group_addon uuid;
  v_group_spicy uuid;
  v_p1 uuid;
  v_p2 uuid;
  v_p3 uuid;
begin
  -- store
  insert into public.stores(owner_id, name, slug)
  values (v_owner, '林記小吃', 'lin-snack')
  returning id into v_store;

  -- tables T01~T30
  for i in 1..30 loop
    insert into public.tables(store_id, table_code, display_name)
    values (
      v_store,
      'T' || lpad(i::text, 2, '0'),
      i::text || '桌'
    );
  end loop;

  -- categories
  insert into public.categories(store_id, name, sort) values (v_store, '主食', 1) returning id into v_cat_main;
  insert into public.categories(store_id, name, sort) values (v_store, '湯品', 2) returning id into v_cat_soup;

  -- products
  insert into public.products(store_id, category_id, name, price, sort) values (v_store, v_cat_main, '滷肉飯', 45, 1) returning id into v_p1;
  insert into public.products(store_id, category_id, name, price, sort) values (v_store, v_cat_main, '乾麵', 50, 2) returning id into v_p2;
  insert into public.products(store_id, category_id, name, price, sort) values (v_store, v_cat_soup, '貢丸湯', 40, 1) returning id into v_p3;

  -- option groups: 加料(多選)、辣度(單選必選)
  insert into public.option_groups(store_id, name, selection_type, is_required, sort)
  values (v_store, '加料', 'multi', false, 1) returning id into v_group_addon;

  insert into public.option_groups(store_id, name, selection_type, is_required, sort)
  values (v_store, '辣度', 'single', true, 2) returning id into v_group_spicy;

  -- options for 加料
  insert into public.options(group_id, name, price_delta, sort) values (v_group_addon, '加蛋', 15, 1);
  insert into public.options(group_id, name, price_delta, sort) values (v_group_addon, '加麵', 10, 2);
  insert into public.options(group_id, name, price_delta, sort) values (v_group_addon, '加肉', 25, 3);

  -- options for 辣度
  insert into public.options(group_id, name, price_delta, sort) values (v_group_spicy, '不辣', 0, 1);
  insert into public.options(group_id, name, price_delta, sort) values (v_group_spicy, '小辣', 0, 2);
  insert into public.options(group_id, name, price_delta, sort) values (v_group_spicy, '大辣', 0, 3);

  -- link products -> option groups
  insert into public.product_option_groups(product_id, group_id) values (v_p1, v_group_addon);
  insert into public.product_option_groups(product_id, group_id) values (v_p2, v_group_addon);

  insert into public.product_option_groups(product_id, group_id) values (v_p1, v_group_spicy);
  insert into public.product_option_groups(product_id, group_id) values (v_p2, v_group_spicy);

end $$;
