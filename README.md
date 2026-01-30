# QR 點餐系統 Starter（可跑 Demo）

你要做的事情只有兩件：
1) Supabase 建資料表 + seed 資料
2) 本機跑起 Next.js

---

## A. Supabase：建資料表（一定要做）
1. 在 Supabase 建一個新 project
2. 左側進 **SQL Editor** → New query
3. 依序貼上並 Run：
   - `supabase/schema.sql`
   - （可選，用於 demo 匿名讀菜單）`supabase/public_read_demo.sql`

---

## B. Supabase：建立一個店家登入帳號（給廚房頁用）
1. 左側進 **Authentication** → Users → Add user
2. 建一個 email/password
3. 記下「User UUID」
4. 打開 `supabase/seed.sql` 把 `v_owner` 換成你剛剛的 UUID
5. 回到 SQL Editor，貼上 `supabase/seed.sql` → Run

---

## C. 本機：啟動網站
1. 安裝 Node.js（建議 18+）
2. 在本專案根目錄新增 `.env.local`（可以先複製 `.env.example`）
3. 填入：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   以上都在 Supabase Project Settings → API

4. 安裝並啟動：
   ```bash
   npm install
   npm run dev
   ```

---

## D. 你要打開的網址
- 客人端（桌號已帶入）：
  `http://localhost:3000/o/lin-snack/t/T01`

- 店家登入：
  `http://localhost:3000/admin/login`

- 廚房看單：
  `http://localhost:3000/admin/kitchen`

---

## E. Demo 驗證
1) 客人端加入購物車 → 送出訂單  
2) 廚房頁會即時看到新單（Realtime）

---

如果你要做成真正可賣 SaaS（多店、多權限、公開 view、QR PDF、列印），下一步再加。
