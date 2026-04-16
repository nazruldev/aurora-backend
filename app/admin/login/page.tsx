"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const cfg = sp.get("err") === "config";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(cfg ? "SESSION_SECRET belum diset di server." : null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(typeof j.error === "string" ? j.error : "Gagal masuk");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: "2rem", display: "flex", justifyContent: "center" }}>
      <div className="card" style={{ width: "100%" }}>
        <h1 style={{ marginTop: 0 }}>Admin login</h1>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.75rem" }}>
          <label>
            <div className="muted">Username</div>
            <input
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </label>
          <label>
            <div className="muted">Password</div>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </label>
          {err ? <div className="err">{err}</div> : null}
          <button type="submit" disabled={loading}>
            {loading ? "Memproses…" : "Masuk"}
          </button>
        </form>
        <p className="muted" style={{ marginBottom: 0, marginTop: "1rem" }}>
          Default bootstrap: user <code>admin</code>, password dari env atau{" "}
          <code>change-me-now</code>.
        </p>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<main style={{ padding: "2rem" }}>Memuat…</main>}>
      <LoginForm />
    </Suspense>
  );
}
