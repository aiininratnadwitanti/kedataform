# KeDataForm Studio

Aplikasi pembuat formulir modern dengan backend **Express + MySQL** dan **login Google OAuth 2.0**.
Frontend: React 19 + Vite + Tailwind. Semua data (form, respons, user, settings, chat AI) tersimpan di MySQL.

## Menjalankan

```bash
npm install
npm run dev
```

Buka **http://localhost:4000**, lalu klik **Lanjutkan dengan Akun Google**.

Konfigurasi lengkap (termasuk cara membuat kredensial Google OAuth di Google Cloud Console) ada di
**[docs/SETUP.md](docs/SETUP.md)**.

## Dokumentasi

| Dokumen | Isi |
|---------|-----|
| [docs/PRD.md](docs/PRD.md) | Product Requirements Document (proses bisnis, scope, data model). |
| [docs/SETUP.md](docs/SETUP.md) | Setup MySQL, Google OAuth, env vars, menjalankan. |
| [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md) | Kontrak REST API `/api/v1`. |
| [docs/DATA_CATALOG.md](docs/DATA_CATALOG.md) | Skema tabel MySQL. |

## Scripts

| Script | Fungsi |
|--------|--------|
| `npm run dev` | Jalankan server (Express + Vite middleware). |
| `npm run build` | Build produksi (vite). |
| `npm start` | Jalankan server produksi (butuh `dist/`). |
| `npm run lint` | Typecheck (`tsc --noEmit`). |

## Struktur backend

```
server.ts            # entry: express, cookie-parser, mount /api/v1, Gemini proxy, Vite/static
server/db.ts         # mysql2 pool + helper transaksi
server/schema.ts     # migrasi skema idempoten + seed template
server/auth.ts       # sesi (cookie opaque) + Google OAuth 2.0
server/api.ts        # semua endpoint /api/v1
```

## Env vars

Lihat `.env.example`. Ringkas: `DB_*`, `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI`, `ADMIN_EMAILS`, `PORT`, `APP_URL`, `GEMINI_API_KEY`.

> Login email/sandi dinonaktifkan di v1 (murni Google). Data `localStorage` lama diimpor otomatis sekali saat login pertama.
