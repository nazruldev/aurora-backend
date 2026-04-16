import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: "2rem", maxWidth: 560 }}>
      <h1 style={{ marginTop: 0 }}>Access codes</h1>
      <p className="muted">
        Admin: generate batch kode, atur status, dan uji validasi. DB: SQLite
        (lokal / Turso di Vercel).
      </p>
      <p>
        <Link href="/admin/login">Masuk admin</Link>
      </p>
    </main>
  );
}
