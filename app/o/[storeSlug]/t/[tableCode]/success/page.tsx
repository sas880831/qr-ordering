"use client";
import { useSearchParams, useParams } from "next/navigation";

export default function SuccessPage() {
  const sp = useSearchParams();
  const { tableCode } = useParams<{ tableCode: string }>();
  const orderId = sp.get("orderId");
  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>
      <h2>已送出 ✅</h2>
      <div>桌號：{tableCode}</div>
      <div style={{ marginTop: 8 }}>訂單編號：{orderId}</div>
      <div style={{ marginTop: 16, color: "#666" }}>你可以再掃一次 QR 繼續加點。</div>
    </div>
  );
}
