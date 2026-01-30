"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { CartItem, CreateOrderPayload } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";

type Category = { id: string; name: string; sort: number };
type Product = { id: string; name: string; price: number; category_id: string | null; is_active: boolean; sort: number };

type OptionGroup = { id: string; name: string; selection_type: "single" | "multi"; is_required: boolean; sort: number };
type Option = { id: string; group_id: string; name: string; price_delta: number; sort: number };

export default function OrderPage() {
  const params = useParams<{ storeSlug: string; tableCode: string }>();
  const router = useRouter();

  const storeSlug = params.storeSlug;
  const tableCode = params.tableCode;

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [productGroupMap, setProductGroupMap] = useState<Map<string, string[]>>(new Map());

  const [cart, setCart] = useState<CartItem[]>([]);
  const [note, setNote] = useState("");

  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [tempQty, setTempQty] = useState(1);
  const [tempSelected, setTempSelected] = useState<Record<string, string[]>>({});

  const total = useMemo(() => {
    return cart.reduce((sum, it) => {
      const optSum = it.options.reduce((s, o) => s + o.price_delta, 0);
      return sum + (it.unit_price + optSum) * it.qty;
    }, 0);
  }, [cart]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);

      const { data: store, error: storeErr } = await supabase
        .from("stores")
        .select("id, slug, name")
        .eq("slug", storeSlug)
        .single();

      if (storeErr || !store) {
        setLoading(false);
        return;
      }

      const [catRes, prodRes, ogRes, optRes, pogRes] = await Promise.all([
        supabase.from("categories").select("id,name,sort").eq("store_id", store.id).order("sort", { ascending: true }),
        supabase.from("products").select("id,name,price,category_id,is_active,sort").eq("store_id", store.id).eq("is_active", true).order("sort", { ascending: true }),
        supabase.from("option_groups").select("id,name,selection_type,is_required,sort").eq("store_id", store.id).order("sort", { ascending: true }),
        supabase.from("options").select("id,group_id,name,price_delta,sort").order("sort", { ascending: true }),
        supabase.from("product_option_groups").select("product_id,group_id"),
      ]);

      setCategories((catRes.data as any) ?? []);
      setProducts((prodRes.data as any) ?? []);
      setOptionGroups((ogRes.data as any) ?? []);
      setOptions(((optRes.data as any) ?? []).filter((o: Option) => (ogRes.data ?? []).some((g: any) => g.id === o.group_id)));

      const map = new Map<string, string[]>();
      (pogRes.data as any[] | null)?.forEach((r) => {
        if (!map.has(r.product_id)) map.set(r.product_id, []);
        map.get(r.product_id)!.push(r.group_id);
      });
      setProductGroupMap(map);

      setLoading(false);
    };

    run();
  }, [storeSlug]);

  const grouped = useMemo(() => {
    const byCat = new Map<string, Product[]>();
    products.forEach(p => {
      const key = p.category_id ?? "uncat";
      if (!byCat.has(key)) byCat.set(key, []);
      byCat.get(key)!.push(p);
    });
    return byCat;
  }, [products]);

  const openProduct = (p: Product) => {
    setActiveProduct(p);
    setTempQty(1);
    setTempSelected({});
  };
  const closeModal = () => setActiveProduct(null);

  const groupsForProduct = useMemo(() => {
    if (!activeProduct) return [];
    const groupIds = productGroupMap.get(activeProduct.id) ?? [];
    return optionGroups.filter(g => groupIds.includes(g.id));
  }, [activeProduct, optionGroups, productGroupMap]);

  const optionsForGroup = (groupId: string) => options.filter(o => o.group_id === groupId);

  const toggleOption = (groupId: string, optionId: string, selectionType: "single" | "multi") => {
    setTempSelected(prev => {
      const current = prev[groupId] ?? [];
      let next: string[] = [];
      if (selectionType === "single") next = [optionId];
      else next = current.includes(optionId) ? current.filter(x => x !== optionId) : [...current, optionId];
      return { ...prev, [groupId]: next };
    });
  };

  const addToCart = () => {
    if (!activeProduct) return;

    for (const g of groupsForProduct) {
      if (g.is_required) {
        const selected = tempSelected[g.id] ?? [];
        if (selected.length === 0) {
          alert(`請選擇：${g.name}`);
          return;
        }
      }
    }

    const selectedOptions = Object.entries(tempSelected).flatMap(([gid, ids]) => {
      return ids.map(id => {
        const o = options.find(x => x.id === id);
        if (!o) return null;
        return { option_id: o.id, name: o.name, price_delta: o.price_delta };
      }).filter(Boolean) as any[];
    });

    const item: CartItem = {
      product_id: activeProduct.id,
      name: activeProduct.name,
      qty: tempQty,
      unit_price: activeProduct.price,
      options: selectedOptions,
    };

    setCart(prev => [...prev, item]);
    closeModal();
  };

  const submit = async () => {
    if (!cart.length) return;

    const payload: CreateOrderPayload = { storeSlug, tableCode, note: note.trim() || undefined, items: cart };

    const res = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok || !json?.ok) {
      alert(`送單失敗：${json?.error || "unknown"}`);
      return;
    }

    setCart([]);
    router.push(`/o/${storeSlug}/t/${tableCode}/success?orderId=${json.orderId}`);
  };

  if (loading) return <div style={{ padding: 16 }}>載入中…</div>;

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: 16, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2>點餐（桌號 {tableCode}）</h2>
        <div>小計：{total} 元</div>
      </div>

      {categories.map(c => (
        <section key={c.id} style={{ marginTop: 18 }}>
          <h3>{c.name}</h3>
          {(grouped.get(c.id) ?? []).map(p => (
            <button
              key={p.id}
              onClick={() => openProduct(p)}
              style={{ width: "100%", textAlign: "left", padding: 12, marginTop: 8, border: "1px solid #ddd", borderRadius: 10 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>{p.name}</div>
                <div>{p.price} 元</div>
              </div>
            </button>
          ))}
        </section>
      ))}

      <section style={{ marginTop: 24 }}>
        <h3>購物車</h3>
        {cart.length === 0 ? <div>尚未加入品項</div> : null}
        {cart.map((it, idx) => (
          <div key={idx} style={{ padding: 10, border: "1px solid #eee", borderRadius: 10, marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{it.name}</strong>
              <span>x{it.qty}</span>
            </div>
            {it.options.length ? (
              <div style={{ marginTop: 6, fontSize: 13, color: "#333" }}>
                {it.options.map(o => `${o.name}${o.price_delta ? `(+${o.price_delta})` : ""}`).join("、")}
              </div>
            ) : null}
          </div>
        ))}

        <div style={{ marginTop: 12 }}>
          <textarea
            placeholder="備註（可選）"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ width: "100%", minHeight: 60, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
          />
        </div>

        <button
          onClick={submit}
          disabled={!cart.length}
          style={{ width: "100%", padding: 14, marginTop: 12, borderRadius: 12, border: "none", background: "#111", color: "#fff", cursor: "pointer" }}
        >
          送出訂單（{total} 元）
        </button>
      </section>

      {activeProduct ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ width: "100%", maxWidth: 520, background: "#fff", borderRadius: 14, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3>{activeProduct.name}</h3>
              <button onClick={closeModal}>關閉</button>
            </div>
            <div>價格：{activeProduct.price} 元</div>

            {groupsForProduct.map(g => (
              <div key={g.id} style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 700 }}>
                  {g.name}{g.is_required ? "（必選）" : ""} / {g.selection_type === "single" ? "單選" : "多選"}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {optionsForGroup(g.id).map(o => {
                    const selected = (tempSelected[g.id] ?? []).includes(o.id);
                    return (
                      <button
                        key={o.id}
                        onClick={() => toggleOption(g.id, o.id, g.selection_type)}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 999,
                          border: "1px solid " + (selected ? "#111" : "#ddd"),
                          background: selected ? "#111" : "#fff",
                          color: selected ? "#fff" : "#111",
                        }}
                      >
                        {o.name}{o.price_delta ? ` +${o.price_delta}` : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 14 }}>
              <button onClick={() => setTempQty(q => Math.max(1, q - 1))}>-</button>
              <div>數量：{tempQty}</div>
              <button onClick={() => setTempQty(q => Math.min(50, q + 1))}>+</button>
            </div>

            <button onClick={addToCart} style={{ width: "100%", padding: 12, marginTop: 14, borderRadius: 12, border: "none", background: "#111", color: "#fff" }}>
              加入購物車
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
