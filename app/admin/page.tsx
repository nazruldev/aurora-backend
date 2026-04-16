"use client";

import { useCallback, useEffect, useState } from "react";

type Row = {
  id: number;
  code: string;
  status: string;
  batchId: string | null;
  note: string | null;
  expiresAt: string | null;
  usedAt: string | null;
  createdAt: string | null;
};

export default function AdminDashboard() {
  const [user, setUser] = useState<{ id: string; username: string } | null>(
    null
  );
  const [items, setItems] = useState<Row[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [count, setCount] = useState(5);
  const [note, setNote] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [lastBatch, setLastBatch] = useState<string | null>(null);
  const [lastCodes, setLastCodes] = useState<string[]>([]);
  const [validateInput, setValidateInput] = useState("");
  const [validateOut, setValidateOut] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const loadMe = useCallback(async () => {
    const r = await fetch("/api/auth/me");
    const j = await r.json();
    setUser(j.user ?? null);
  }, []);

  const loadCodes = useCallback(async () => {
    const q = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";
    const r = await fetch(`/api/codes${q}`);
    if (!r.ok) {
      setErr("Gagal memuat kode");
      return;
    }
    const j = await r.json();
    setItems(j.items ?? []);
    setErr(null);
  }, [statusFilter]);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  useEffect(() => {
    void loadCodes();
  }, [loadCodes]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  async function generate() {
    setMsg(null);
    setErr(null);
    const body: {
      count: number;
      note?: string;
      expiresAt?: string | null;
    } = { count };
    if (note.trim()) body.note = note.trim();
    if (expiresAt) body.expiresAt = new Date(expiresAt).toISOString();
    const r = await fetch("/api/codes/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setErr(typeof j.error === "string" ? j.error : "Generate gagal");
      return;
    }
    setLastBatch(j.batchId ?? null);
    setLastCodes(Array.isArray(j.codes) ? j.codes : []);
    setMsg(`Batch ${j.batchId}: ${j.codes?.length ?? 0} kode dibuat.`);
    await loadCodes();
  }

  async function patchStatus(id: number, status: string) {
    setErr(null);
    const r = await fetch(`/api/codes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setErr(typeof j.error === "string" ? j.error : "Update gagal");
      return;
    }
    await loadCodes();
  }

  async function tryValidate() {
    setValidateOut(null);
    setErr(null);
    const r = await fetch("/api/codes/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: validateInput }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setValidateOut(typeof j.error === "string" ? j.error : "Request gagal");
      return;
    }
    if (j.valid) setValidateOut(`Valid — kode ${j.code} ditandai used.`);
    else setValidateOut(`Tidak valid: ${j.reason}`);
    await loadCodes();
  }

  return (
    <main style={{ padding: "1.5rem", maxWidth: 1100, margin: "0 auto" }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <div className="muted">
            {user ? `Masuk sebagai ${user.username}` : "…"}
          </div>
        </div>
        <button type="button" className="secondary" onClick={() => void logout()}>
          Keluar
        </button>
      </div>

      {err ? <div className="err" style={{ marginBottom: "0.75rem" }}>{err}</div> : null}
      {msg ? <div className="ok" style={{ marginBottom: "0.75rem" }}>{msg}</div> : null}

      <section className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ marginTop: 0 }}>Generate batch</h2>
        <div className="row">
          <label>
            <span className="muted">Jumlah</span>
            <input
              type="number"
              min={1}
              max={500}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </label>
          <label style={{ flex: 1, minWidth: 160 }}>
            <span className="muted">Catatan (opsional)</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} style={{ width: "100%" }} />
          </label>
          <label>
            <span className="muted">Kadaluarsa (opsional)</span>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </label>
          <button type="button" onClick={() => void generate()}>
            Generate
          </button>
        </div>
        {lastBatch ? (
          <p className="muted" style={{ marginBottom: 0 }}>
            Kode terakhir (cuplikan): {lastCodes.slice(0, 8).join(", ")}
            {lastCodes.length > 8 ? "…" : ""}
          </p>
        ) : null}
      </section>

      <section className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ marginTop: 0 }}>Tes validasi (publik API)</h2>
        <div className="row">
          <input
            placeholder="Masukkan kode"
            value={validateInput}
            onChange={(e) => setValidateInput(e.target.value)}
            style={{ minWidth: 200, flex: 1 }}
          />
          <button type="button" className="secondary" onClick={() => void tryValidate()}>
            Validasi
          </button>
        </div>
        {validateOut ? <p className="muted" style={{ marginBottom: 0 }}>{validateOut}</p> : null}
      </section>

      <section className="card">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <h2 style={{ margin: 0 }}>Daftar kode</h2>
          <label className="row" style={{ gap: "0.5rem" }}>
            <span className="muted">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">semua</option>
              <option value="active">active</option>
              <option value="used">used</option>
              <option value="inactive">inactive</option>
            </select>
            <button type="button" className="secondary" onClick={() => void loadCodes()}>
              Refresh
            </button>
          </label>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Kode</th>
                <th>Status</th>
                <th>Batch</th>
                <th>Catatan</th>
                <th>Expires</th>
                <th>Used</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={`${it.id}-${it.status}`}>
                  <td>{it.id}</td>
                  <td style={{ fontFamily: "ui-monospace, monospace" }}>{it.code}</td>
                  <td>{it.status}</td>
                  <td style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {it.batchId ?? "—"}
                  </td>
                  <td>{it.note ?? "—"}</td>
                  <td>{it.expiresAt ? new Date(it.expiresAt).toLocaleString() : "—"}</td>
                  <td>{it.usedAt ? new Date(it.usedAt).toLocaleString() : "—"}</td>
                  <td>
                    <select
                      defaultValue={it.status}
                      onChange={(e) => void patchStatus(it.id, e.target.value)}
                    >
                      <option value="active">active</option>
                      <option value="used">used</option>
                      <option value="inactive">inactive</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
