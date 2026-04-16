# aurora-backend

Next.js + SQLite — access codes (login admin, generate, validasi).

Aplikasi untuk **login admin**, **generate batch kode**, **validasi** (sekali pakai → `used`), dan **mengubah status** kode. Database: **SQLite** lewat LibSQL (`@libsql/client` + Drizzle).

## Lokal

```powershell
cd "C:\Users\NAZRUL\Pictures\New folder"
copy .env.example .env
# isi SESSION_SECRET (minimal 16 karakter)
npm install
npm run dev
```

- Beranda: `http://localhost:3000`
- Admin: `http://localhost:3000/admin` (redirect ke login jika belum ada sesi)
- Tanpa `DATABASE_URL`, DB file disimpan di `data/app.db` (folder dibuat otomatis).

## Environment

| Variabel | Keterangan |
|----------|------------|
| `SESSION_SECRET` | Wajib (≥16 char). Menandatangani cookie JWT admin. |
| `BOOTSTRAP_ADMIN_USER` / `BOOTSTRAP_ADMIN_PASSWORD` | Jika tabel admin kosong, user pertama dibuat dari nilai ini. |
| `DATABASE_URL` | Opsional. Default `file:.../data/app.db`. Di hosting serverless pakai **Turso** (`libsql://...`). |
| `TURSO_AUTH_TOKEN` | Token Turso bila `DATABASE_URL` menunjuk ke Turso. |

## API

Semua route di bawah ini relatif ke origin app (mis. `http://localhost:3000`).

| Method | Path | Auth | Fungsi |
|--------|------|------|--------|
| `POST` | `/api/auth/login` | — | Body `{ "username", "password" }` → set cookie sesi. |
| `POST` | `/api/auth/logout` | — | Hapus cookie sesi. |
| `GET` | `/api/auth/me` | — | `{ "user": null }` atau `{ "user": { "id", "username" } }`. |
| `POST` | `/api/codes/generate` | Cookie admin | Body `{ "count"?, "note"?, "expiresAt"? (ISO) }` → `{ batchId, codes }`. |
| `GET` | `/api/codes` | Cookie admin | Query `?status=active|used|inactive` opsional. |
| `PATCH` | `/api/codes/[id]` | Cookie admin | Body `{ "status": "active" \| "used" \| "inactive" }`. |
| `POST` | `/api/codes/validate` | — | Body `{ "code" }` → `{ "valid": true, "code" }` atau `{ "valid": false, "reason" }`. |

Validasi sukses hanya jika status `active`, belum kedaluwarsa, lalu baris di-update ke `used` (idempotensi race: satu baris).

## Vercel

1. Buat database **Turso** (disarankan); salin `DATABASE_URL` + `TURSO_AUTH_TOKEN`.
2. Di Vercel → Project → Settings → Environment Variables: set `SESSION_SECRET`, `DATABASE_URL`, `TURSO_AUTH_TOKEN`, dan bootstrap admin jika perlu.
3. Deploy branch/repo seperti biasa (`npm run build`).

**Catatan:** file SQLite di filesystem Vercel **tidak persisten**; untuk production gunakan Turso (atau backend SQLite terpisah).

## Skema Drizzle (opsional)

```bash
npm run db:push
```

Menggunakan `drizzle.config.ts` dan `lib/schema.ts`. App juga menjalankan `CREATE TABLE IF NOT EXISTS` idempotent lewat `ensureMigrated()` saat runtime.
