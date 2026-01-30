"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const login = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    router.push("/admin/kitchen");
  };

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>
      <h2>店家登入</h2>
      <div style={{ color: "#555" }}>先在 Supabase Auth 建一個 email/password 使用者，並在 seed.sql 綁定 owner_id。</div>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{ width:"100%", padding:10, marginTop:10 }} />
      <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{ width:"100%", padding:10, marginTop:10 }} />
      <button onClick={login} style={{ width:"100%", padding:12, marginTop:12, background:"#111", color:"#fff", border:"none", borderRadius:10 }}>登入</button>
    </div>
  );
}
