"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Order = { id: string; status: string; total: number; created_at: string; table_id: string; note: string | null };
type Table = { id: string; display_name: string; table_code: string };
type Store = { id: string; name: string; slug: string };

export default function Kitchen() {
  const [store, setStore] = useState<Store | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);

  useEffect(() => {
    const boot = async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) {
        window.location.href = "/admin/login";
        return;
      }

      const { data: s, error: se } = await supabase.from("stores").select("id,name,slug").eq("owner_id", uid).single();
      if (se || !s) { alert("找不到店家 store（owner_id 未綁定？）"); return; }
      setStore(s as any);

      const [tRes, oRes] = await Promise.all([
        supabase.from("tables").select("id,display_name,table_code").eq("store_id", s.id),
        supabase.from("orders").select("id,status,total,created_at,table_id,note").eq("store_id", s.id).order("created_at", { ascending: false }).limit(50),
      ]);

      setTables((tRes.data as any) ?? []);
      setOrders((oRes.data as any) ?? []);

      const ch = supabase
        .channel(`orders_${s.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `store_id=eq.${s.id}` }, async () => {
          const { data: oRes2 } = await supabase
            .from("orders")
            .select("id,status,total,created_at,table_id,note")
            .eq("store_id", s.id)
            .order("created_at", { ascending: false })
            .limit(50);
          setOrders((oRes2 as any) ?? []);
        })
        .subscribe();

      return () => { supabase.removeChannel(ch); };
    };

    boot();
  }, []);

  const tableName = useMemo(() => {
    const map = new Map(tables.map(t => [t.id, t.display_name]));
    return (table_id: string) => map.get(table_id) ?? table_id;
  }, [tables]);

  const updateStatus = async (orderId: string, status: string) => {
    if (!store) return;
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId).eq("store_id", store.id);
    if (error) alert(error.message);
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16, fontFamily: "system-ui" }}>
      <h2>廚房看單 {store ? `｜${store.name}` : ""}</h2>

      {orders.map(o => (
        <div key={o.id} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12, marginTop: 10, background: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>{tableName(o.table_id)}</strong>
            <span>{new Date(o.created_at).toLocaleString()}</span>
          </div>

          <div style={{ marginTop: 6 }}>狀態：<b>{o.status}</b>｜總額：{o.total} 元</div>
          {o.note ? <div style={{ marginTop: 6, color: "#555" }}>備註：{o.note}</div> : null}

          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <button onClick={() => updateStatus(o.id, "new")}>新單</button>
            <button onClick={() => updateStatus(o.id, "making")}>製作中</button>
            <button onClick={() => updateStatus(o.id, "served")}>已出餐</button>
            <button onClick={() => updateStatus(o.id, "paid")}>已結帳</button>
          </div>
        </div>
      ))}
    </div>
  );
}
