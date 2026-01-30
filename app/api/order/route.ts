import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import type { CreateOrderPayload } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateOrderPayload;

    if (!body?.storeSlug || !body?.tableCode || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }

    // 1) store
    const { data: store, error: storeErr } = await supabaseAdmin
      .from("stores")
      .select("id, slug")
      .eq("slug", body.storeSlug)
      .single();

    if (storeErr || !store) return NextResponse.json({ error: "store_not_found" }, { status: 404 });

    // 2) table
    const { data: table, error: tableErr } = await supabaseAdmin
      .from("tables")
      .select("id, table_code, is_active")
      .eq("store_id", store.id)
      .eq("table_code", body.tableCode)
      .single();

    if (tableErr || !table || !table.is_active) return NextResponse.json({ error: "table_not_found" }, { status: 404 });

    // 3) price check
    const productIds = [...new Set(body.items.map(i => i.product_id))];
    const { data: products, error: prodErr } = await supabaseAdmin
      .from("products")
      .select("id, name, price, is_active")
      .eq("store_id", store.id)
      .in("id", productIds);

    if (prodErr || !products) return NextResponse.json({ error: "products_load_failed" }, { status: 500 });

    const productMap = new Map(products.map(p => [p.id, p]));

    const optionIds = [...new Set(body.items.flatMap(i => i.options?.map(o => o.option_id) ?? []))];
    let optionMap = new Map<string, { id: string; name: string; price_delta: number }>();
    if (optionIds.length) {
      const { data: opts, error: optErr } = await supabaseAdmin
        .from("options")
        .select("id, name, price_delta")
        .in("id", optionIds);
      if (optErr || !opts) return NextResponse.json({ error: "options_load_failed" }, { status: 500 });
      optionMap = new Map(opts.map(o => [o.id, o]));
    }

    let total = 0;
    const normalizedItems = body.items.map(i => {
      const p = productMap.get(i.product_id);
      if (!p || !p.is_active) throw new Error("inactive_product");

      const qty = Math.max(1, Math.min(50, Number(i.qty || 1)));
      const base = p.price;

      const normalizedOptions = (i.options ?? []).map(x => {
        const real = optionMap.get(x.option_id);
        if (!real) throw new Error("invalid_option");
        return { option_id: real.id, name: real.name, price_delta: real.price_delta };
      });

      const optionSum = normalizedOptions.reduce((s, o) => s + o.price_delta, 0);
      total += (base + optionSum) * qty;

      return {
        product_id: p.id,
        qty,
        unit_price: base,
        note: i.note?.slice(0, 80) || null,
        options: normalizedOptions,
      };
    });

    // 4) order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({ store_id: store.id, table_id: table.id, note: body.note?.slice(0, 120) || null, total })
      .select("id")
      .single();

    if (orderErr || !order) return NextResponse.json({ error: "order_create_failed" }, { status: 500 });

    // 5) items
    const { data: orderItems, error: itemsErr } = await supabaseAdmin
      .from("order_items")
      .insert(
        normalizedItems.map(it => ({
          order_id: order.id,
          product_id: it.product_id,
          qty: it.qty,
          unit_price: it.unit_price,
          note: it.note,
        }))
      )
      .select("id, product_id");

    if (itemsErr || !orderItems) return NextResponse.json({ error: "items_create_failed" }, { status: 500 });

    const orderItemIdMap = new Map(orderItems.map(oi => [oi.product_id, oi.id]));

    const optionRows = normalizedItems.flatMap(it => {
      const order_item_id = orderItemIdMap.get(it.product_id);
      if (!order_item_id) return [];
      return it.options.map(o => ({
        order_item_id,
        option_id: o.option_id,
        price_delta: o.price_delta,
      }));
    });

    if (optionRows.length) {
      const { error: oioErr } = await supabaseAdmin.from("order_item_options").insert(optionRows);
      if (oioErr) return NextResponse.json({ error: "item_options_create_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, orderId: order.id });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
