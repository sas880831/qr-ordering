export default function Home() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>
      <h1>QR 點餐系統（Starter）</h1>
      <ol>
        <li>先去 Supabase 建資料庫並跑 schema.sql / seed.sql</li>
        <li>設定 .env.local</li>
        <li>打開客人頁：/o/&lt;storeSlug&gt;/t/&lt;tableCode&gt;</li>
        <li>打開廚房頁：/admin/kitchen（需要登入）</li>
      </ol>
      <div style={{ marginTop: 14, color: "#555" }}>
        範例：/o/lin-snack/t/T01
      </div>
    </div>
  );
}
